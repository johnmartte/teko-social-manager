# Graph Report - teko-social-manager  (2026-10-29)

## Corpus Check
- Corpus is ~48,006 words - fits in a single context window. You may not need a graph.

## Summary
- 845 nodes · 1611 edges · 60 communities (26 shown, 34 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Automations Page
- Bulk Publish Scheduler
- Composer Dependencies
- Frontend Package Config
- Auth & Credentials Models
- Inbox Page
- Messages Controller
- Instagram Controller
- Scheduled Posts
- Avatar UI
- Token Middleware
- API Package Config
- shadcn Config
- Forgot Password Flow
- Dashboard Page
- Header & Dropdown
- TS Config
- Auth Controller
- Upload & API Routes
- Facebook Controller
- Meta API Service
- Users Migration
- Dialog UI
- Select UI
- Workspace Controller
- AppShell & Icons
- Community 26
- Community 27
- Tabs UI
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 45
- Community 46
- Community 47
- Community 51

## God Nodes (most connected - your core abstractions)
1. `MetaApiService` - 50 edges
2. `api()` - 44 edges
3. `react` - 38 edges
4. `Card()` - 28 edges
5. `useAuth()` - 28 edges
6. `BulkScheduler()` - 26 edges
7. `Button()` - 26 edges
8. `InstagramController` - 23 edges
9. `cn` - 20 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `DialogFooter()` --calls--> `Button()`  [EXTRACTED]
  frontend/src/components/ui/dialog.tsx → frontend/src/components/ui/button.tsx
- `AuthController` --inherits--> `Controller`  [EXTRACTED]
  api/app/Http/Controllers/AuthController.php → api/app/Http/Controllers/Controller.php
- `AuthController` --references--> `MetaApiService`  [EXTRACTED]
  api/app/Http/Controllers/AuthController.php → api/app/Services/MetaApiService.php
- `FacebookController` --inherits--> `Controller`  [EXTRACTED]
  api/app/Http/Controllers/FacebookController.php → api/app/Http/Controllers/Controller.php
- `InstagramController` --inherits--> `Controller`  [EXTRACTED]
  api/app/Http/Controllers/InstagramController.php → api/app/Http/Controllers/Controller.php

## Import Cycles
- None detected.

## Communities (60 total, 34 thin omitted)

### Community 0 - "Automations Page"
Cohesion: 0.05
Nodes (68): AutomationsPage(), loadData(), toggleRule(), AutomationsResponse, MetricCard(), Rule, CommentsPage(), handleDelete() (+60 more)

### Community 1 - "Bulk Publish Scheduler"
Cohesion: 0.06
Nodes (44): BulkItem, BulkScheduler(), addItem(), asScheduledAt(), dayFromOffset(), fillFirstEmptySlots(), formatYMD(), handleMassiveUpload() (+36 more)

### Community 2 - "Composer Dependencies"
Cohesion: 0.04
Nodes (48): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+40 more)

### Community 3 - "Frontend Package Config"
Cohesion: 0.06
Nodes (45): eslintConfig, dependencies, class-variance-authority@^0.7.1, cn@^0.4.0, date-fns@^4.1.0, lucide-react@^1.48.0, next@16.2.1, radix-ui@^1.6.7 (+37 more)

### Community 4 - "Auth & Credentials Models"
Cohesion: 0.06
Nodes (5): SocialCredential, User, UserFactory, DatabaseSeeder, ProductionSystemUserSeeder

### Community 5 - "Inbox Page"
Cohesion: 0.08
Nodes (28): Conversation, ConversationsResponse, formatTime(), InboxPage(), openConversation(), sendReply(), Message, MessagesResponse (+20 more)

### Community 8 - "Scheduled Posts"
Cohesion: 0.12
Nodes (10): PublishScheduledPosts, ScheduledPostController, {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), AutomationRule, InboxConversation (+2 more)

### Community 9 - "Avatar UI"
Cohesion: 0.11
Nodes (5): ScrollArea(), ScrollBar(), cn, radix-ui, react

### Community 10 - "Token Middleware"
Cohesion: 0.13
Nodes (6): EnsureFacebookToken, EnsureInstagramToken, PublishDuePosts, ResolveSocialCredentials, {closure#1}(), {closure#2}()

### Community 11 - "API Package Config"
Cohesion: 0.12
Nodes (19): devDependencies, axios@^1.11.0, concurrently@^9.0.1, laravel-vite-plugin@^3.0.0, tailwindcss@^4.0.0, @tailwindcss/vite@^4.0.0, vite@^8.0.0, tailwindcss (+11 more)

### Community 12 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 13 - "Forgot Password Flow"
Cohesion: 0.24
Nodes (12): nextConfig, ForgotPasswordPage(), Step, LoginPage(), RegisterPage(), BrandMark(), Button(), buttonVariants (+4 more)

### Community 14 - "Dashboard Page"
Cohesion: 0.19
Nodes (17): AccountPreviewCard(), ConnectPrompt(), DashboardContent(), DashboardPage(), DashboardSkeleton(), DashboardWorkspaceData, QuickAction(), SocialTask (+9 more)

### Community 15 - "Header & Dropdown"
Cohesion: 0.17
Nodes (9): ConnectionPill(), Header(), DropdownMenu(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuSeparator(), DropdownMenuTrigger() (+1 more)

### Community 16 - "TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 18 - "Upload & API Routes"
Cohesion: 0.14
Nodes (3): Controller, UploadController, POST /debug/register()

### Community 21 - "Users Migration"
Cohesion: 0.23
Nodes (6): {closure#1}(), {closure#2}(), {closure#3}(), {closure#1}(), {closure#2}(), {closure#3}()

### Community 22 - "Dialog UI"
Cohesion: 0.22
Nodes (4): DialogContent(), DialogFooter(), DialogOverlay(), DialogPortal()

### Community 23 - "Select UI"
Cohesion: 0.22
Nodes (3): SelectContent(), SelectScrollDownButton(), SelectScrollUpButton()

### Community 25 - "AppShell & Icons"
Cohesion: 0.29
Nodes (6): AppShell(), FacebookIcon(), IconProps, InstagramIcon(), navItems, Sidebar()

### Community 30 - "Tabs UI"
Cohesion: 0.33
Nodes (3): TabsList(), tabsListVariants, class-variance-authority

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 46 - "Community 46"
Cohesion: 0.50
Nodes (3): DB_DATABASE, PHP_CLI_SERVER_WORKERS, start.sh script

## Knowledge Gaps
- **2 isolated node(s):** `DB_DATABASE`, `PHP_CLI_SERVER_WORKERS`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 313 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Avatar UI` to `Automations Page`, `Bulk Publish Scheduler`, `Frontend Package Config`, `Inbox Page`, `Forgot Password Flow`, `Dashboard Page`, `Header & Dropdown`, `Dialog UI`, `Select UI`, `AppShell & Icons`, `Table UI`, `Card UI`, `Tabs UI`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `DB_DATABASE`, `PHP_CLI_SERVER_WORKERS` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Automations Page` be split into smaller, more focused modules?**
  _Cohesion score 0.05034199726402189 - nodes in this community are weakly interconnected._
- **Why does `api()` connect `Automations Page` to `Bulk Publish Scheduler`, `Inbox Page`, `Forgot Password Flow`, `Dashboard Page`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Bulk Publish Scheduler` be split into smaller, more focused modules?**
  _Cohesion score 0.06019871420222092 - nodes in this community are weakly interconnected._
- **Why does `MetaApiService` connect `Messages Controller` to `Instagram Controller`, `Scheduled Posts`, `Community 48`, `Auth Controller`, `Facebook Controller`, `Meta API Service`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `Composer Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._