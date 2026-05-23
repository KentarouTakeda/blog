---
title: "Laravel 13: How FormRequest, Policy, and ValidationRule Reached Their Final Form"
subtitle: Decoupling at the entry point — the "thin controller" realized through conventions and attributes
description: How to use Laravel 13's FormRequest, Policy, ValidationRule, `#[Authorize]`, and `#[Middleware]`, walked through a GitHub-style pull-request workflow. Plus a look back at how the API evolved since Laravel 9, and how conventions and attributes leave the controller free of design decisions.
date: 2026-05-03
---

## 1. The Fight Against Bloat: Entry and Exit

Receive a request, return a response. That should be all there is to it — and yet the code somehow balloons to hundreds of lines. The top of the controller fills with near-identical boilerplate, and by the time you reach the business logic that actually matters, you've lost the will to read on. Sound familiar?

Laravel gives you ways to lift the *routine work* off the controller at both ends, entry and exit. The exit was the subject of {% post_link 2026-04-26-decoupling-with-laravel-events the previous article %}. This time it's the entry point: authentication, authorization, and validation, all in one go.

Use these as the boilerplate intends and the controller gets dramatically thinner. Plenty of you already know them well, but the syntax and the best practices have shifted from one Laravel version to the next.

This article assumes Laravel 13 and lays out the entry point in its current form. The story of how it got there is for the final section.

## 2. The Shape of the Entry Point — FormRequest and Policy

Break down the work at the entry point and it splits into three: authentication (whose request is this?), authorization (is that person allowed to do this?), and validation (are the inputs legitimate?). All three can be confined to framework-side preprocessing.

Here's the path from the framework receiving the request to the controller body taking over:

```plantuml
actor User
participant Laravel
participant Controller

User -> Laravel : GET /posts/{post}

group Framework
  group middleware: auth
    Laravel -> Laravel : Authenticate
    Laravel --> User : 401 on failure
  end

  group Route Model Binding
    Laravel -> Laravel : Resolve model
    Laravel --> User : 404 on failure
  end

  group Authorize
    Laravel -> Laravel : Authorize
    Laravel --> User : 403 on failure
  end

  group FormRequest
    Laravel -> Laravel : Validate
    Laravel --> User : 422 on failure
  end

  Laravel -> Controller : Invoke
end

group Application
  Controller -> Controller : Main logic
end

group Framework
  Controller -> User : 200 + Resource
end
```

Here's how you write that in Laravel 13.

Authentication is required with the `#[Middleware]` attribute:
```php app/Http/Controllers/PostController.php
#[Middleware('auth')]
public function show(ShowPostRequest $request, Post $post)
{
    //
}
```

`FormRequest` declares the validation rules. In the controller you take only the values that passed, through `$request->validated()`:

```php app/Http/Requests/ShowPostRequest.php
class ShowPostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'include' => [
                'nullable',
                'string',
                Rule::in(['comments', 'reactions']),
            ],
        ];
    }
}
```

`Policy` holds the authorization decision. Its first argument, `User`, is filled in automatically with the authenticated user:
```php app/Policies/PostPolicy.php
class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        return $post->isPublic() || $post->author->is($user);
    }
}
```

The `#[Authorize]` attribute attaches that authorization to the controller method.

```php
#[Authorize('view', 'post')]
public function show(ShowPostRequest $request, Post $post)
{
    //
}
```

The framework calls all of these on its own, and a failure stops things right there. By the time control reaches the controller body, the request has cleared every check.

That means more than a lower line count. The inputs are guaranteed safe and valid by the time they reach your hands, and you simply have no way to perform a *dangerous operation*.

Extract your own Validator and Authorizer and call them from the controller, and yes, the line count drops just the same. But you still have to write the wiring, and forgetting it is a straight line to a security incident. Ride on the framework's conventions and that worry is gone.

In the next section, with a fuller example, let's put a naive version that uses none of this side by side with one that leans on Laravel 13's features.

## 3. A Worked Example: A GitHub-Style Pull-Request Workflow

The subject is a GitHub-style pull-request workflow. I've simplified a few things for the sake of explanation, but read it with GitHub in mind. It's a good case: state transitions and authorization combine in all sorts of ways, and the entry point tends to get complicated.

Here's the bare minimum of the domain:

```plantuml
hide empty members

entity User

enum Role <<pivot>> {
  * maintainer
  * committer
  * reader
}

entity Repository {
}

entity PullRequest {
  state
  ..
  * draft
  * open
  * closed
  * merged
}

Role ||-u-o{ Repository
Role ||-d-o{ User
User ||-r-o{ PullRequest
Repository ||-r-o{ PullRequest
```

The Eloquent models behind the implementation examples that follow:

{% details The Eloquent models for users, repositories, and pull requests %}

```php app/Models/User.php
class User extends Authenticatable
{
    public function pullRequests(): HasMany
    {
        return $this->hasMany(PullRequest::class, 'author_id');
    }

    public function repositories(): BelongsToMany
    {
        return $this->belongsToMany(Repository::class)
            ->withPivot('role');
    }
}
```

```php app/Models/Repository.php
class Repository extends Model
{
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role');
    }
}
```

```php app/Enums/PullRequestState.php
enum PullRequestState: string
{
    case Draft = 'draft';
    case Open = 'open';
    case Closed = 'closed';
    case Merged = 'merged';
}
```

```php app/Models/PullRequest.php
class PullRequest extends Model
{
    protected function casts(): array
    {
        return [
            'state' => PullRequestState::class,
        ];
    }

    public function repository(): BelongsTo
    {
        return $this->belongsTo(Repository::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
```

{% enddetails %}

Let's narrow it to *updating a pull request*: an endpoint that changes the title, the body, and the base branch.

### Written Naively

Let's write it using none of Laravel's HTTP-layer features — just a Symfony Request in, a Response out. Authentication, authorization, and validation all line up inside the controller body:

{% details The naive controller, in full %}

```php app/Http/Controllers/UpdatePullRequest.php
class UpdatePullRequest
{
    public function __invoke(Request $request, int $number): Response
    {
        // Authentication: resolve the User from the Bearer token
        $token = $this->extractBearerToken($request);
        if ($token === null) {
            return new JsonResponse([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $user = User::query()->where('api_token', $token)->first();
        if ($user === null) {
            return new JsonResponse([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Fetch the resource
        $pullRequest = PullRequest::query()->where('number', $number)->first();
        if ($pullRequest === null) {
            return new JsonResponse([
                'message' => 'Not Found'
            ], 404);
        }

        // Authorization: the author, or a collaborator with maintainer permission. State must be open or draft only
        $isAuthor = $pullRequest->author_id === $user->id;
        $isMaintainer = $pullRequest->repository
            ->collaborators
            ->contains(fn (User $collaborator) =>
                $collaborator->id === $user->id
                && $collaborator->pivot->role === 'maintainer'
            );

        if (! $isAuthor && ! $isMaintainer) {
            return new JsonResponse([
                'message' => 'Forbidden'
            ], 403);
        }

        if (! in_array($pullRequest->state, [PullRequestState::Open, PullRequestState::Draft], true)) {
            return new JsonResponse([
                'message' => 'Forbidden'
            ], 403);
        }

        // Validation
        $payload = json_decode($request->getContent(), true) ?? [];
        $errors = [];

        $title = $payload['title'] ?? null;
        if (! is_string($title) || $title === '') {
            $errors['title'] = 'The title is not entered';
        } elseif (mb_strlen($title) > 255) {
            $errors['title'] = 'The title is too long';
        }

        $body = $payload['body'] ?? null;
        if ($body !== null && ! is_string($body)) {
            $errors['body'] = 'There is an error in the body input';
        }

        $baseRef = $payload['base_ref'] ?? null;
        if ($baseRef !== null && ! is_string($baseRef)) {
            $errors['base_ref'] = 'There is an error in the target branch input';
        }

        if (! empty($errors)) {
            return new JsonResponse([
                'errors' => $errors
            ], 422);
        }

        // Update
        $pullRequest->update([
            'title' => $title,
            'body' => $body,
            'base_ref' => $baseRef,
        ]);

        return new JsonResponse($pullRequest->toArray(), 200);
    }

    private function extractBearerToken(Request $request): ?string
    {
        $header = $request->headers->get('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return substr($header, 7);
    }
}
```

{% enddetails %}

About ninety lines. Pulling apart the HTTP request, resolving the user, fetching the resource, authorizing, validating, and at last the update. It's a long road to the *update a pull request* we actually came to do.

### Riding on Laravel 13's Conventions

Rewrite the same behavior with `#[Middleware]` + `#[Authorize]` + `FormRequest` + `Policy`, and the controller body becomes this:

```php app/Http/Controllers/UpdatePullRequest.php
class UpdatePullRequest
{
    #[Middleware('auth')]
    #[Authorize('update', 'pullRequest')]
    public function __invoke(
        UpdatePullRequestRequest $request,
        PullRequest $pullRequest,
    ): PullRequestResource {
        $pullRequest->update($request->validated());

        return $pullRequest->toResource();
    }
}
```

The method is down to two steps. Everything that isn't *updating a pull request* has been pushed outside it:

{% details Authorization %}

```php app/Policies/PullRequestPolicy.php
class PullRequestPolicy
{
    public function update(User $user, PullRequest $pullRequest): bool
    {
        if (! in_array($pullRequest->state, [PullRequestState::Open, PullRequestState::Draft], true)) {
            return false;
        }

        if ($pullRequest->author_id === $user->id) {
            return true;
        }

        return $pullRequest->repository
            ->collaborators
            ->contains(fn (User $collaborator) =>
                $collaborator->id === $user->id
                && $collaborator->pivot->role === 'maintainer'
            );
    }
}
```

{% enddetails %}

{% details Validation %}

```php app/Http/Requests/UpdatePullRequestRequest.php
class UpdatePullRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'base_ref' => ['nullable', 'string', new BranchName()],
        ];
    }
}
```

{% enddetails %}

### Same Line Count, Separated Responsibilities

Of course the ninety lines of the Before didn't collapse into "a few lines" overall. The point is somewhere else.

In the Before, the through-line, *updating a pull request*, was buried under branches for authentication, authorization, and validation. In the After, each of those is lifted into its own file by responsibility. What's left in the controller body is the update, and only the update.

Need to fix a validation rule? The `FormRequest`. Need to change authorization? The `Policy`. The place to edit is never in doubt. And the ability name on `#[Authorize]` is the Policy method name itself, so your IDE jumps straight to the authorization code[^vscode-laravel].

## 4. Three Layers That Fit Inside Unit Tests

The responsibilities we split out aren't just relocated. FormRequest, Policy, an Eloquent model — any of them you can test lightly, by making an instance and calling a method.

The policy is the clearest case. `PullRequestPolicy::update()` is a pure method: it takes a `User` and a `PullRequest` and returns a bool. The test looks like this:

```php tests/Unit/PullRequestPolicyTest.php
#[Test]
public function the_author_can_update_the_pull_request(): void
{
    $author = new User()->forceFill(['id' => 42]);

    $pullRequest = new PullRequest([
        'author_id' => 42,
        'state' => PullRequestState::Open,
    ]);

    $policy = new PullRequestPolicy();

    $this->assertTrue($policy->update($author, $pullRequest));
}
```

No database, no service container. Joel Clermont described this same lightness on his blog[^mastering-laravel-policy-refactor]:

> I can test a policy by just creating a model and calling the policy method with that model. I no longer had to set up a more complex feature test and simulate a request into the application to exercise the policy logic.

That the policy stays thin is the flip side of Laravel not forcing your authorization model into a fixed frame. Ownership, roles, whether a relationship exists — it all goes in as ordinary PHP.

Validation has the same property. You write one method, `validate()`, from `interface ValidationRule`. The single-responsibility custom rules I mentioned at the start take exactly this shape. The `BranchName` rule from `base_ref` earlier reads like this:

```php app/Rules/BranchName.php
class BranchName implements ValidationRule
{
    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail,
    ): void
    {
        if (! preg_match('#^[\w\-/]+$#', (string) $value)) {
            $fail('The :attribute must be a valid branch name.');
        }
    }
}
```

The test is simple, the same way. Each custom rule, and the input you give it, is the granularity of a unit test.

Less widely known: tests that use Eloquent models can run without a DB too. Build the domain with `new` and `setRelation()`, and hand it straight to the test:

```php
$user = new User()->forceFill(['id' => 23]);
$user->setRelation('pivot', new Pivot([
    'role' => 'maintainer'
]));

$repository = new Repository();
$repository->setRelation('collaborators', collect([$user]));

$pullRequest = new PullRequest([
    'author_id' => 42,
    'state' => PullRequestState::Open,
]);
$pullRequest->setRelation('repository', $repository);

$policy = new PullRequestPolicy();
$this->assertTrue($policy->update($user, $pullRequest));
```

Even logic that walks relationships to decide a role, we tested entirely as a unit test.

## 5. Going Further: State-Transition Authorization

So far we've kept to *updating a pull request*. Let's take on something closer to reality. Reopening a closed pull request, merging an approved one — authorizing operations that carry a state transition walks into a trap if you apply the shape we've used so far without thinking.

### The Single-Endpoint Trap

Go by the textbook CRUD playbook and you'd stand up a single endpoint that updates the state, with a `state` request parameter naming the destination. But that drags a nasty problem into the Policy:

```php app/Policies/PullRequestPolicy.php
public function update(User $user, PullRequest $pullRequest): bool
{
    $next = request()->enum('state', PullRequestState::class);

    if ($next === PullRequestState::Closed && $pullRequest->state === PullRequestState::Open) {
        return $this->canCloseBy($user, $pullRequest);
    }

    if ($next === PullRequestState::Open && $pullRequest->state === PullRequestState::Closed) {
        return $this->canReopenBy($user, $pullRequest);
    }

    if ($next === PullRequestState::Merged && $pullRequest->state === PullRequestState::Open) {
        return $this->canMergeBy($user, $pullRequest);
    }

    // ... draft → open, etc.

    return false;
}
```

Pulling the parameter out of `request()` has made the unit test impossible. And the single `update()` method now pulls double duty, covering both "permissions" and "state-transition rules", and has bloated for it.

### Splitting by State Transition

Instead of funneling every operation through one endpoint, give each state transition its own endpoint and its own Policy method.

```php routes/api.php
Route::post('/pulls/{pullRequest:number}/close', CloseController::class);
Route::post('/pulls/{pullRequest:number}/reopen', ReopenController::class);
Route::post('/pulls/{pullRequest:number}/merge', MergeController::class);
```

```php app/Http/Controllers/MergeController.php
class MergeController
{
    #[Middleware('auth')]
    #[Authorize('merge', 'pullRequest')]
    public function __invoke(PullRequest $pullRequest): PullRequestResource
    {
        $pullRequest->merge();

        return $pullRequest->toResource();
    }
}
```

```php app/Policies/PullRequestPolicy.php
class PullRequestPolicy
{
    public function update(User $user, PullRequest $pullRequest): bool
    {
        /* Update rules for the title, body, and base branch */
    }

    public function close(User $user, PullRequest $pullRequest): bool {
        /* Transition rule for open → closed */
    }

    public function reopen(User $user, PullRequest $pullRequest): bool {
        /* Transition rule for closed → open */
    }

    public function merge(User $user, PullRequest $pullRequest): bool {
        /* Transition rule for open → merged */
    }
}
```

Each method owns a single transition, and the dependence on `request()` is gone. The unit tests survive.

`php artisan route:list -v` will even list the authorization condition on each route. What was buried inside the Policy in the single-endpoint design surfaces as metadata on the route definitions.

### Authorization by Relationships

Whether a pull request can be merged isn't settled by permissions alone. Take the rule that *a maintainer can merge only a pull request that has collected a set number of approvals from reviewers*. Add a `reviews()` relationship to `PullRequest` and a `required_approvals` column to `Repository`, and the Policy reads like this:

```php app/Policies/PullRequestPolicy.php
public function merge(User $user, PullRequest $pullRequest): bool
{
    $isMaintainer = $pullRequest->repository
        ->collaborators
        ->contains(fn (User $collaborator) =>
            $collaborator->id === $user->id
            && $collaborator->pivot->role === 'maintainer'
        );

    if (! $isMaintainer) {
        return false;
    }

    $approvals = $pullRequest->reviews
        ->where('state', ReviewState::Approved)
        ->count();

    return $approvals >= $pullRequest
        ->repository
        ->required_approvals;
}
```

The `BelongsToMany` that decides the role, the `HasMany` that counts approvals — the relationships become the vocabulary of authorization, just as they are.

GitHub's permission model comes from two things combined: your role on a repository, and the review relationships on each pull request. The latter kind of model has a name, ReBAC[^rebac] — but in Laravel you never have to think in those categories. Because the Policy doesn't force a shape on your authorization model, you write the Eloquent models' own vocabulary straight into it, and that *is* the authorization logic.

Even requirements this complex, state transitions and all, fall out cleanly within the conventions.

Laravel itself, by the way, took a long time to arrive at this shape. To close, let's trace the road the entry point's authentication and authorization API has traveled.

## 6. The Road to the Final Form

The starting point is eight years back. In December 2018, Taylor Otwell posted this on what was then Twitter:

{% twitter https://x.com/taylorotwell/status/1078494087525908481 %}

From that one tweet, the entry-point API has been tidied up enormously. Here's the evolution, in order:

1. Laravel 10: custom validation rules unified under `interface ValidationRule`
   - Laravel 9: a format that implemented a single method
   - Laravel 10: the two contracts `Rule` and `InvokableRule` folded into one
     - The `make:rule` stub changed to match
2. Laravel 10.8: extra validation simplified with `FormRequest::after()`
   - Before, you poked at the validator instance directly through `withValidator($validator)`
   - `after(): array` lets you list multiple rule objects instead
   - The DI container injects any service you need through the method
3. Laravel 11: policy auto-discovery became the default
   - **The direct answer to that opening tweet, six years on**
   - `App\Models\Foo` maps to `App\Policies\FooPolicy` by namespace convention
     - Registering in the `AuthServiceProvider` was no longer needed
   - Step outside the naming convention and you override it with the `#[UsePolicy]` attribute[^policy-discovery]
4. Laravel 11: `authorizeResource` all but vanished from the official docs
   - It had a habit of skipping authorization on non-standard actions[^securing-laravel-resource]
5. Laravel 11/13: authorization calls gathered into the `#[Authorize]` attribute
   - Laravel 11 dropped the `AuthorizesRequests` trait from the base controller
   - The `$this->authorize()` call moved to Laravel 13's `#[Authorize]` attribute
6. Laravel 11/13: middleware declarations gathered into the `#[Middleware]` attribute
   - It used to be `$this->middleware('auth')` in the constructor
   - Laravel 11 replaced that with the `HasMiddleware` interface
   - Laravel 13 moved it to the `#[Middleware]` attribute

This whole line of APIs reached its final form in Laravel 13 — that's my read on it. Validation, authorization, middleware: each improved on its own track, but they all head the same way, toward *pulling responsibilities into thin classes through conventions and attributes*.

And yet I still run into it, right now and ongoing: code written inconsistently within a single project, or holding onto the style of an end-of-life version on the very latest Laravel.

I wrote this article to give that a nudge.

[^vscode-laravel]: Jumping from a "string" key, like an authorization action name, is supported by the [Official Laravel VS Code Extension](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel). It handles many Laravel-specific constructs that ordinary IDEs miss — translation keys, environment variables, `config()` keys, and more. Develop the Laravel Way and it's essential.

[^mastering-laravel-policy-refactor]: Joel Clermont [Refactoring logic into a policy method](https://masteringlaravel.io/daily/2024-06-19-refactoring-logic-into-a-policy-method)

[^rebac]: Relationship-Based Access Control. A general term for designs that make the relationship itself the basis of the authorization decision. [Relationship-based access control - Wikipedia](https://en.wikipedia.org/wiki/Relationship-based_access_control)

[^policy-discovery]: [Laravel 13.x Documentation, "Registering Policies"](https://laravel.com/docs/13.x/authorization#registering-policies)

[^securing-laravel-resource]: Stephen Rees-Carter [Securing Laravel "Security Tip: Watch out for Resource Authorisation"](https://securinglaravel.com/security-tip-watch-out-for-resource/)
