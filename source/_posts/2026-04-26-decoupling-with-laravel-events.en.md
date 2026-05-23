---
title: 'That Loose Coupling? Laravel Can Do It'
subtitle: Loose coupling with Eloquent × events — rethinking Clean Architecture and large-scale development
description: Decouple side effects with Laravel's event system, walked through an e-commerce order-confirmation example. The design separates concerns with Events and Listeners while keeping Eloquent, and compares it against Clean Architecture's Repository + UseCase structure.
date: 2026-04-26 22:00
---

## 1. Decoupling Side Effects Without Removing Eloquent

The more an application grows, the more side effects accumulate on a single operation. If the main flow has to absorb all of them, and every new side effect means touching that flow again, it slips out of control fast.

Reach for loose coupling in Laravel and you'll usually hit the same advice, often framed in DDD terms: *separate side effects with events*. Translated into code, that tends to mean hiding Eloquent behind a Repository, gathering logic into a UseCase, and drawing boundaries with DTOs. That's one valid choice.

I've never been one to force that structure, and I've watched it go wrong: a Repository that stays a thin wrapper, a UseCase that ends up calling Eloquent directly anyway. The abstraction never earns back its cost, and the code just grows more complex. mpyw makes the same point (my translation)[^mpyw]:

> Forcing the Repository pattern onto an ActiveRecord-oriented framework is fatal, so don't be afraid to use the Eloquent model's features inside your UseCase.

I agree. There's no need to remove Eloquent. This article is about a path to loose coupling that keeps it.

One note on scope. The mechanism here is the Event/Listener pair you fire explicitly. The Eloquent Observer is a different beast, and nothing here applies to it[^khorev-observer].

## 2. Classifying Side Effects, and How Each Should Run

We say "side effects" as if they were one thing. In practice they're a mix: some should surface to the user as an error, and some never should. Blur that line and your "decoupling with events" can quietly strip the controller of responsibilities that were rightfully its own.

Side effects get easier to reason about once you see them as three layers[^greeden-classification].

| Layer | Example | On failure |
| - | - | - |
| Core | Confirming the order and payment | Return an error to the user |
| Immediate detection | Reserving inventory | Not shown to the user; detect immediately and respond |
| Eventual consistency | Confirmation email, admin notification | Not shown to the user; absorbed by retries |

The test is simple. Ask one question: *when this step fails, should the user see an error?* If yes, it's core. If not, but it needs catching right away, it's immediate detection. If not, and a retry will do, it's eventual consistency.

```plantuml
rectangle "Core\n(order / payment)" as req
rectangle "Immediate detection\n(inventory)" as imp
rectangle "Eventual consistency\n(email / notification)" as aux

rectangle "Run directly by the controller" as direct
rectangle "Received by an Event / Listener" as event

req --> direct
imp --> event
aux --> event
```

Why not put core on an event? Because of what an event is. An event announces *a fact that happened*, and its listeners react without knowing about one another. The ordering and consistency that core processing depends on fall outside what that mechanism promises.

So core runs directly in the controller (or in whatever it delegates to, when things get complex), and the event fires once that is done. The code in the next section takes exactly this shape.

No side effects, no event. Plain CRUD ends at `Model::create()`. Wrapping core-only work in an event just spends the cost of abstraction with nothing to show for it.

## 3. A Worked Example: Order Confirmation on an E-Commerce Site

Time for a worked example. Picture the order-confirmation flow of an e-commerce site.

### The Scenario and Flow

The core transaction is the order and the payment; if either fails, the order never happens. Updating inventory isn't core, but a drift there throws off the next order, so it can't be ignored. The confirmation email and the admin notification have no bearing on whether the order succeeds, even if they never arrive. All three layers from the previous section line up neatly inside one operation.

```plantuml
actor Customer
participant OrderController as Controller
database DB
participant "OrderConfirmed" as Event
participant UpdateInventory
queue Queue as Q
participant SendConfirmation
participant NotifyAdmin

Customer -> Controller : POST /orders

group Core (sync, in TX)
  Controller -> DB : Confirm order + payment
end

Controller -> Event : dispatch

group Immediate detection (sync)
  Event -> UpdateInventory : call
  UpdateInventory -> DB : Update inventory
end

group Eventual consistency (async)
  Event -> Q : enqueue SendConfirmation
  Event -> Q : enqueue NotifyAdmin
end

Controller -> Customer : Response

|||

Q --> SendConfirmation : run async
Q --> NotifyAdmin : run async
```

### A Thin Controller and an Event

Out of that whole flow, here's everything the controller writes.

```php app/Http/Controllers/OrderController.php
class OrderController
{
    public function store(ConfirmOrderRequest $request, PaymentGateway $payment): OrderResource
    {
        $order = DB::transaction(function () use ($request, $payment) {
            $order = Order::create($request->validated());

            $payment->pay($order);

            return $order;
        });

        event(new OrderConfirmed($order));

        return $order->toResource();
    }
}
```

It settles the order and payment inside a transaction, then fires `OrderConfirmed` after the commit. The controller never has to know about inventory or email. Most CRUD lands in exactly this shape.

`OrderConfirmed` itself is thinner still.

```php app/Events/OrderConfirmed.php
class OrderConfirmed
{
    public function __construct(
        public Order $order
    ) {}
}
```

It takes an `Order` and holds it. There's no method to implement and no field layout to decide; it settles into a so-called POPO (Plain Old PHP Object).

### Reserving Inventory Synchronously

Inventory updates run synchronously, in the `UpdateInventory` listener.

```php app/Listeners/UpdateInventory.php
class UpdateInventory
{
    public function __construct(
        private Inventory $inventory
    ) {}

    public function handle(OrderConfirmed $event): void
    {
        $this->inventory
            ->deductFor($event->order);
    }
}
```

It receives `OrderConfirmed` and hands the work to `Inventory`. Synchronous is deliberate: a failure comes back to the caller as an exception, to be dealt with inside the request. This is the immediate-detection layer in its typical form.

### Email and Notifications, Sent Asynchronously

The email and the admin notification run asynchronously.

```php app/Listeners/SendConfirmation.php
class SendConfirmation implements ShouldQueue
{
    public function handle(OrderConfirmed $event): void
    {
        Mail::to($event->order->customer)
            ->send(new OrderConfirmationMail($event->order));
    }
}
```

```php app/Listeners/NotifyAdmin.php
class NotifyAdmin implements ShouldQueue
{
    public function handle(OrderConfirmed $event): void
    {
        Notification::send(
            Admin::all(),
            new NewOrderNotification($event->order)
        );
    }
}
```

The only difference from `UpdateInventory` is one line: `implements ShouldQueue`. With it, the listener runs on the queue worker. If a failure can be absorbed by a retry, with no error shown to the user directly, that work can go async. This is the eventual-consistency layer in its typical form.

The two listeners know nothing of each other; they run independently through `OrderConfirmed`. If email delivery stalls, the notification still goes out.

### Wiring It Up with Auto-Discovery

Three listeners now, synchronous and asynchronous, and still nothing to write to wire them up. Laravel's auto-discovery[^auto-discovery] scans the classes under `app/Listeners/` and registers each one against the event type-hinted on its `handle` method. No config entries, no container bindings. The dependency graph stays dead simple.

```plantuml
class OrderController <<Controller>>
class OrderConfirmed <<Event>>
class UpdateInventory <<Listener>>
class SendConfirmation <<Listener>>
class NotifyAdmin <<Listener>>

OrderController -d-> OrderConfirmed
UpdateInventory .u.> OrderConfirmed
SendConfirmation .u.> OrderConfirmed
NotifyAdmin .u.> OrderConfirmed
```

## 4. Don't Multiply Decisions — Comparing Against the CA Structure

By now some readers will be thinking, *you could do all this with Clean Architecture too*. Structurally, you could. The difference isn't how much code you write; it's how many decisions you make before you write any.

### Decisions, Not File Count

The design from earlier — Eloquent behind a Repository, logic gathered into a UseCase, boundaries drawn with DTOs — I'll call the *CA structure* here, for short.

Take the scenario we just built the Laravel Way[^laravel-way], and rebuild it in the CA structure. You get this set of classes. To keep the comparison fair, the CA side omits interfaces and runs as lean as it can. Real projects often slip interfaces in front of the Repository and Services. That only adds more files, and more decisions.

| Role | CA structure (9 files) | Laravel Way (6 files) |
| - | - | - |
| Validation | `ConfirmOrderRequest` | `ConfirmOrderRequest` |
| HTTP processing | `OrderController` | `OrderController` |
| Eloquent operations | `OrderRepository` | - |
| DTO | `OrderDTO` | - |
| Sequential execution of side effects | `ConfirmOrderUseCase` | - |
| Wrapping the payment call | `PaymentService` | - |
| Firing the event | - | `OrderConfirmed` (Event) |
| Reserving inventory | `InventoryService` | `UpdateInventory` (Listener) |
| Sending the confirmation email | `SendConfirmationService` | `SendConfirmation` (Listener) |
| Notifying the admin | `NotifyAdminService` | `NotifyAdmin` (Listener) |

The file count differs by just three. But count was never the point. The cost is the decisions that linger inside each class on the CA side:

- Repository: what to expose
- DTO: which fields to carry
- Service: where to split it, where to put it
- Interface: which way dependencies point, and how to name things
- Wiring: written out by hand

None of them is a big decision on its own. Each is one you have to clear before you can start writing.

The Laravel Way has decisions too. Most of them, though, get absorbed by Laravel's conventions:

- Event: holds an Eloquent model and nothing else, so there are no fields to design
- Listener: drop it in `app/Listeners/` and auto-discovery finds it
- Wiring: just the type hint on `handle(...)`

And decisions aren't just effort. Mistakes ride along with them. Split your interfaces wrong and you're chasing fixes; miss a field on a DTO and a type mismatch shows up between Services (I've gone in to fix exactly that, more than once). The fix is more code, and that code needs more tests to guard it.

### Separation at Entry and Exit

The Laravel Way can absorb this many decisions because of how Laravel itself is built. FormRequest and Policy sit at the controller's entry point, pulling request validation and authorization out of the main flow. Event, Listener, and Job sit at the exit, pulling side effects out of it. There are tools for separation at both ends, and the main flow only has to write the thin slice in between.

The code the Laravel Way spares you is also code you can't get wrong. You can't botch the field design of `OrderConfirmed`, and you can't forget to register a listener.

Code you don't write has no bugs.

## 5. From Synchronous to Asynchronous — Without Rebuilding the Structure

The order-confirmation email has outgrown synchronous sending. We want it on a queue.

### `implements ShouldQueue`

Remember `SendConfirmation` from earlier. One line is all that stands between synchronous and asynchronous.

```diff app/Listeners/SendConfirmation.php
 class SendConfirmation
+    implements ShouldQueue
 {
     // ...
 }
```

`handle()`, the constructor, `OrderConfirmed`, `OrderController`, the commit boundary — not one of them is rewritten.

### The Universal Problems Stay, but the Structure Holds

Going async does bring things to think about. Idempotency, what to do on failure, the context you lose when the request scope disappears, the chance that a job reloading from the DB through `SerializesModels` sees a state different from the one at dispatch. These are universal problems, independent of architecture, and no structure lets you dodge them.

The CA structure faces those same problems. The difference is that it also demands a structural change first. To put `SendConfirmationService` on a queue, you stand up a new job class, rewrite the UseCase call to `dispatch`, pick what to serialize as the job's arguments, and decide whether the Service's logic stays put or moves. Before you can even get to the universal problems, the work of rebuilding the structure is in your way.

In the Laravel Way, the listener is already separated from its caller through `OrderConfirmed`. Flip it to async with `implements ShouldQueue`, and you're free to focus on the universal problems. Once more: code you don't write has no bugs.

### A Listener That Stays a POPO

The code from here on assumes Laravel 13 or newer.

From here, you grow the now-async listener. Cap the retries with `#[Tries(3)]`, change the timeout with `#[Timeout(60)]`, handle final cleanup on failure with `failed()`.

```php app/Listeners/SendConfirmation.php
#[Queue('emails')]
#[Tries(3)]
#[Timeout(60)]
class SendConfirmation implements ShouldQueue
{
    public function handle(OrderConfirmed $event): void
    {
        // ...
    }

    public function failed(OrderConfirmed $event, Throwable $e): void
    {
        // ...
    }
}
```

Each is just an attribute or a method added to the listener you already have. The body of `handle()` doesn't change.

Strip the attributes off and you're left with plain PHP: a lone `handle(OrderConfirmed $event): void`. The listener stays close to a POPO[^laravel-13-attributes].

## 6. Loose Coupling This Thin Pays Off Daily

The structure not breaking on the way from sync to async isn't a payoff reserved for special occasions. The same solidity shows up again and again in everyday work. Let's look at it through a few design principles:

### The Open-Closed Principle: Changes Closed Inside `app/Listeners/`

Adding, removing, and changing side effects all stay inside `app/Listeners/`. Adding is dropping in a file; removing is deleting one; auto-discovery attaches and detaches the wiring for you. Changing is over once you've edited the relevant listener's `handle()`. The controller, the event, the other listeners — none of them needs a touch.

Migrating away from a controller where side effects have piled up rides on the same property. Lift out the side-effect block, paste it into a listener, and replace it with `event(new ...)`. No design decision gets in the way; the steps themselves are the migration.

Failure handling stays in the same unit too. `#[Tries]`, `#[Timeout]`, and `failed()` belong to their own listener and never drag another one in.

### The Single Responsibility Principle: Three-Layer Testability

A listener carries exactly one side effect, and that makes the test boundaries just as clear. They fall into three layers.

The controller's test checks only that the side effect fired:

```php
Event::fake();

$id = $this->postJson('/orders', [/* ... */])
    ->assertCreated()
    ->json('id');

Event::assertDispatched(
    fn (OrderConfirmed $e) => $e->order->id === $id
);
```

`Event::fake()` stops the listeners from running. The test knows nothing about them.

The listener's test checks only what happens in response to the Event it receives:

```php
$order = Order::factory()->makeOne();

$this->mock(Inventory::class)
    ->shouldReceive('deductFor')
    ->once()
    ->with($order);

$listener = $this->app->make(UpdateInventory::class);
$listener->handle(new OrderConfirmed($order));
```

It resolves the listener from the container and calls `handle()`. No need to go through the controller at all.

Checking the wiring is a safety net. With auto-discovery, placement is registration, so it matters less; still, letting the test state the specification outright isn't a bad thing:

```php
Event::assertListening(
    OrderConfirmed::class,
    UpdateInventory::class
);
```

The point: the three layers don't know about one another.

Run the same scenario in the CA structure and you'd mock `InventoryService` to test `ConfirmOrderUseCase`, with a Repository mock returning an `OrderDTO`.

### The Principle of Least Knowledge: Nightwatch, the "Stranger"

Nightwatch is Laravel's official application-monitoring service. It subscribes to the built-in events the Laravel core fires and gathers metrics from them.

What it collects covers a lot of ground. A sample:

- How often Eloquent lazy loading fires
- Cache hits and misses, and failed writes and deletes
- Queue job attempts and failures
- How long scheduled tasks take to run

Even the Laravel-specific events that general-purpose monitoring tools struggle with come through naturally, straight from the built-in events.

The three parties — the app, Nightwatch, and the Laravel core — are, once again, strangers to one another.

- The app doesn't know Nightwatch. You install the package; the app's code changes not at all
- Nightwatch doesn't know your particular app. It subscribes to the general-purpose Events the Laravel core fires, with no dependence on userland code
- The Laravel core doesn't directly know Nightwatch either. The Events it fires are a general-purpose API exposed to userland; who picks them up is none of its concern

And still the metrics gather. The principle of least knowledge, right there.

## 7. The Question That Always Comes Up

For it or against it, people ask the same thing about Event/Listener: *the code is hard to follow.*

Read straight through `OrderController` and you can't see what happens past `event(new OrderConfirmed(...))`. True. But that's the flip side of separation of concerns doing its job.

The controller knows nothing about inventory, email, or notifications. Add a side effect or drop one, and the controller doesn't flinch. If you can no longer follow it by reading top to bottom, it's largely because you no longer need to.

And when you genuinely do need to follow it, there are ways:

- Trace the references to `OrderConfirmed` in your IDE and you land on the dispatch site and every listener
- `php artisan event:list` lays out which Listeners answer which Events
- The `app/Events/` and `app/Listeners/` directories are themselves a catalog of what can happen

## 8. With Events at the Center, Laravel Comes Together

Put Event/Listener at the center and you start to notice that the rest of Laravel's features have a natural connection point to the event system.

Earlier, email, notifications, and inventory reservation all branched off `OrderConfirmed`. Then one line, `implements ShouldQueue`, moved a listener onto a queue. Both live inside the same picture: *an Event happens, and something follows.*

And the connection points don't stop there. You can control an Event's transaction boundary with `ShouldDispatchAfterCommit`, or implement `ShouldBroadcast` to push it to the frontend. A queued job can switch on `ShouldBeUnique` to suppress duplicate runs. Each is one more line on a listener's or an event's class declaration.

One behavior in particular is worth pausing on: what happens when an event goes onto the queue. Mix `SerializesModels` into an Event and its payload collapses to a class name and a primary key, then gets restored from the DB at run time. Putting a DTO on the Event is a clean option too, but the fact that a trait like this ships as standard tells me Laravel envisions Eloquent models being carried across boundaries.

That loose coupling? Laravel can do it.

[^khorev-observer]: [Why Are Model Observers in Laravel a Bad Practice?](https://medium.com/@dkhorev/why-are-model-observers-in-laravel-a-bad-practice-8feb8526c95e)
[^mpyw]: [The "Pseudo Clean Architecture" That Doesn't Try Hard at All: a Compromise After Five Years of Laravel (Japanese)](https://zenn.dev/yumemi_inc/articles/ce7d09eb6d8117)
[^greeden-classification]: [Practical Complete Guide: Event-Driven Design in Laravel](https://blog.greeden.me/en/2026/04/08/practical-complete-guide-event-driven-design-in-laravel-event-listener-subscriber-broadcasting-separation-of-side-effects-testing-and-accessible-notification-design/)
[^auto-discovery]: [Laravel 13.x Documentation, "Event Discovery"](https://laravel.com/docs/13.x/events#event-discovery)
[^laravel-way]: *Laravel Way* is a term the community uses by custom; there's no firm definition. Here I use it for the structure that follows Laravel's conventions and separates side effects with Event/Listener, without removing Eloquent.
[^laravel-13-attributes]: [Laravel 13.x Documentation, "Expanded PHP Attributes"](https://laravel.com/docs/13.x/releases#php-attributes)
