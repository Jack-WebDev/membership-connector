# Membership Marketplace Implementation Plan

## Core Product Goal

Build a full-stack membership marketplace where:

1. Organizations create and manage memberships.
2. Organizations create pricing tiers for each membership.
3. Members browse public memberships.
4. Members apply to a membership tier.
5. Organization admins review, approve, or reject applications.
6. Approved members gain access to their active membership area.
7. Organization admins post announcements.
8. Members can read announcements, like announcements, and comment on announcements.
9. Organizations can manage members, applications, announcements, admins, permissions, notifications, and demo finance records.

This plan must be implemented with discipline. Build the core flow first. Avoid adding unrequested features.

Authentication-related behavior must be handled by Better Auth. Do not create custom authentication systems, custom password reset logic, custom session logic, or custom auth tables unless required by Better Auth.

---

# Global Engineering Rules

The AI agent must act like a senior product engineer throughout the build.

## Code Quality Rules

Use:

```txt
Clean TypeScript
Small functions
Clear naming
Strict types
Reusable components
Shared validation
Server-side authorization checks
Consistent error handling
Simple abstractions
Readable folder structure
```

Avoid:

```txt
Over-engineering
Large components
Business logic inside UI components
Duplicated permission logic
Duplicated validation logic
Unsafe type casting
Unclear route naming
Hardcoded organization access
Client-only authorization
Unrequested features
```

## React Best Practices

Use:

```txt
Server components by default where appropriate
Client components only when interactivity is required
Small focused components
Controlled forms where needed
Clear loading states
Clear empty states
Clear error states
Optimistic UI only where safe
Accessible buttons, labels, dialogs, and menus
```

Do not place data-fetching, mutation logic, layout logic, and complex UI state into one large component.

## API Best Practices

Use tRPC routers grouped by domain.

Business logic should live in services, not directly inside routers.

Every mutation must:

```txt
Validate input
Authenticate when required
Authorize the user
Perform the action
Return typed data
Create audit logs where appropriate
Create notifications where appropriate
```

## Database Best Practices

Use Drizzle schema and migrations.

Every important relationship should have a foreign key.

Add indexes for common query patterns.

Add unique constraints to prevent duplicate records.

Use enums or explicit constants for statuses and roles.

---

# Product Scope Rules

Implement these:

```txt
Authentication through Better Auth
Role selection
Organization creation
Membership creation
Membership tiers
Public membership browsing
Application submission
Application review
Active membership creation
Announcements
Announcement likes
Announcement comments
Organization member management
Organization admins and permissions
Demo finance records
Notifications
Search and filters for main lists
Seed data
Testing for core flows
```

Do not implement:

```txt
Payment provider checkout
Recurring billing automation
Checkout sessions
Payment webhooks
Invoices
Receipts
Direct messaging
Discussion boards
Platform admin portal
Advanced reporting
Custom branding
Uploads
```

---

# Phase 2: Design System and Shared UI Foundation

## Goal

Create a reusable design system before building pages.

## Visual Direction

Use a warm, premium, minimal SaaS marketplace look.

Recommended palette:

```txt
Background:        #F8F1E8
Surface:           #FFF9F2
Surface Muted:     #EFE1D0
Primary:           #B68A64
Primary Dark:      #7A563C
Secondary:         #D8C3A5
Accent:            #C9A66B
Text Primary:      #3E332E
Text Muted:        #8A7468
Border:            #E4D3C0
Success:           #6F8F72
Warning:           #C8943F
Danger:            #B85C5C
```

## Required App Components

Create using shadcn ui components:

```txt
PageHeader
SectionHeader
DashboardHeader
AppSidebar
MobileNav
EmptyState
LoadingState
ErrorState
ConfirmDialog
StatusBadge
DataTable
SearchInput
FilterBar
StatCard
FormSection
RoleSelectionCard
MembershipCard
OrganizationCard
TierPricingCard
AnnouncementCard
CommentList
CommentInput
NotificationBell
```

## Senior Developer Expectations

Components must be reusable and composable. Do not hardcode page-specific behavior into shared UI components. Keep domain-specific components separate from primitive UI components.

## Acceptance Criteria

```txt
Shared UI package exports components cleanly
Web app can import shared UI components
Components use consistent spacing, radius, border, and typography
Components support loading, empty, and error states where relevant
Mobile responsiveness works for cards, tables, nav, and dialogs
```

---

# Phase 3: Database Schema

## Goal

Create the core PostgreSQL schema with Drizzle.

## Tables

### users

Better Auth should own authentication-related user data. Keep app-specific fields outside auth where appropriate.

Expected fields:

```txt
id
name
email
image
createdAt
updatedAt
```

### user_profiles

```txt
id
userId
firstName
lastName
phone
bio
createdAt
updatedAt
```

### account_roles

A user can eventually have multiple account-level roles.

```txt
id
userId
role
createdAt
```

Allowed roles:

```txt
member
organization
platform_admin
```

Unique constraint:

```txt
userId + role
```

### organizations

```txt
id
name
slug
description
websiteUrl
email
phone
status
createdByUserId
createdAt
updatedAt
```

Statuses:

```txt
draft
active
suspended
archived
```

Constraints:

```txt
slug unique globally
createdByUserId references users.id
```

### organization_admins

```txt
id
organizationId
userId
role
status
invitedByUserId
createdAt
updatedAt
```

Roles:

```txt
owner
admin
membership_manager
finance_manager
content_manager
reviewer
```

Statuses:

```txt
active
invited
removed
```

Constraints:

```txt
organizationId + userId unique
```

### memberships

```txt
id
organizationId
name
slug
description
shortDescription
status
visibility
category
applicationRequired
publicAnnouncementsEnabled
membersOnlyContentEnabled
createdAt
updatedAt
```

Statuses:

```txt
draft
published
paused
archived
```

Visibility:

```txt
public
private
invite_only
```

Constraints:

```txt
organizationId + slug unique
```

### membership_tiers

```txt
id
membershipId
name
description
price
currency
billingInterval
benefits
requirements
maxMembers
status
sortOrder
createdAt
updatedAt
```

Billing intervals:

```txt
free
once_off
monthly
quarterly
yearly
custom
```

Statuses:

```txt
active
inactive
archived
```

Notes:

```txt
price must be non-negative
currency defaults to ZAR unless configured otherwise
benefits can be JSON for version one
requirements can be JSON for version one
```

### membership_applications

```txt
id
membershipId
membershipTierId
organizationId
userId
status
answers
reviewNotes
submittedAt
reviewedAt
reviewedByUserId
createdAt
updatedAt
```

Statuses:

```txt
draft
submitted
under_review
needs_information
approved
rejected
withdrawn
cancelled
```

Constraints:

```txt
Prevent duplicate active applications for the same user and membership
membershipId references memberships.id
membershipTierId references membership_tiers.id
organizationId references organizations.id
userId references users.id
reviewedByUserId references users.id
```

### membership_members

```txt
id
membershipId
membershipTierId
organizationId
userId
applicationId
status
startedAt
expiresAt
cancelledAt
createdAt
updatedAt
```

Statuses:

```txt
active
pending_payment
expired
cancelled
suspended
```

Constraints:

```txt
Prevent duplicate active memberships for the same user and membership
applicationId references membership_applications.id
```

### announcements

```txt
id
organizationId
membershipId
authorUserId
title
body
visibility
status
pinned
publishedAt
createdAt
updatedAt
```

Visibility:

```txt
public
members_only
tier_specific
admins_only
```

Statuses:

```txt
draft
published
archived
```

### announcement_likes

```txt
id
announcementId
userId
createdAt
```

Constraints:

```txt
announcementId + userId unique
```

### announcement_comments

```txt
id
announcementId
userId
parentCommentId
body
status
createdAt
updatedAt
```

Statuses:

```txt
visible
hidden
deleted
```

Rules:

```txt
Support one-level replies at most in version one
Users can delete their own comments
Admins can hide comments
Deleted comments should not be permanently removed by default
```

### saved_memberships

```txt
id
userId
membershipId
createdAt
```

Constraint:

```txt
userId + membershipId unique
```

### notifications

```txt
id
userId
type
title
body
data
readAt
createdAt
```

### finance_transactions

This is for demo finance tracking only. Do not implement payment processing.

```txt
id
organizationId
membershipId
membershipTierId
userId
type
status
amount
currency
provider
providerReference
description
createdAt
updatedAt
```

Types:

```txt
membership_payment
refund
adjustment
payout
fee
```

Statuses:

```txt
pending
successful
failed
refunded
cancelled
```

Provider values for version one:

```txt
manual
cash
eft
demo
```

### audit_logs

```txt
id
organizationId
actorUserId
action
entityType
entityId
metadata
createdAt
```

Examples:

```txt
organization.created
membership.created
membership.published
tier.created
application.submitted
application.approved
application.rejected
announcement.published
comment.hidden
finance.recorded
admin.invited
admin.role_changed
```

## Required Indexes

Add indexes for:

```txt
organizations.slug
memberships.organizationId
memberships.slug
memberships.status
memberships.visibility
membership_tiers.membershipId
membership_applications.userId
membership_applications.organizationId
membership_applications.status
membership_members.userId
membership_members.organizationId
announcements.membershipId
announcements.status
notifications.userId
notifications.readAt
finance_transactions.organizationId
finance_transactions.status
audit_logs.organizationId
```

## Senior Developer Expectations

The agent must design the schema defensively. Use constraints to prevent invalid data instead of relying only on UI behavior. Keep status values consistent between database, validators, and UI badges.

## Acceptance Criteria

```txt
Drizzle schema exists
Migrations run successfully
Foreign keys exist
Common indexes exist
Unique constraints exist
Seed script can create realistic demo data
```

---

# Phase 4: Authentication with Better Auth

## Goal

Implement authentication and session handling using Better Auth.

## Pages

```txt
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password
```

## Rules

Better Auth must handle:

```txt
User registration
Login
Logout
Session management
Forgot password
Reset password
Auth-related database requirements
```

Do not manually implement password hashing, reset tokens, session cookies, or auth tables unless Better Auth requires configuration.

## Required Behavior

```txt
Anonymous users can access public pages
Anonymous users can access auth pages
Authenticated users with no role are redirected to onboarding
Authenticated members can access member routes
Authenticated organization users can access organization routes only when authorized
```

## Senior Developer Expectations

The agent must not mix authentication and authorization. Better Auth handles identity and sessions. The application handles product-specific roles and permissions.

## Acceptance Criteria

```txt
User can register
User can log in
User can log out
User can request password reset through Better Auth
User can reset password through Better Auth
Authenticated session is available to tRPC context
Protected routes reject anonymous users
```

---

# Phase 5: Onboarding and Account Type Selection

## Goal

Guide new users into either member or organization setup.

## Routes

```txt
/onboarding/account-type
/onboarding/member
/onboarding/organization
```

## Account Type Screen

Show two cards:

```txt
Member
"I want to find and join memberships."

Organization
"I want to create and manage memberships."
```

## Member Flow

1. User selects Member.
2. Create `account_roles` record with role `member`.
3. Create `user_profiles` record if missing.
4. Redirect to `/member/dashboard`.

## Organization Flow

1. User selects Organization.
2. Create `account_roles` record with role `organization`.
3. Ask for organization details:

```txt
Organization name
Slug
Description
Contact email
Phone
Website
```

4. Create organization with status `active`.
5. Add user to `organization_admins` as `owner`.
6. Redirect to `/org/[orgSlug]/dashboard`.

## Add Second Role Later

Allow users to add another role later from settings.

## Senior Developer Expectations

The onboarding flow must be transactional where needed. If organization creation succeeds but owner assignment fails, rollback or handle it safely.

## Acceptance Criteria

```txt
New users cannot access dashboards before onboarding
Member onboarding creates member role
Organization onboarding creates organization role
Organization creator becomes owner
Users can later add the second role
Duplicate roles cannot be created
```

---

# Phase 6: Authorization and Permissions

## Goal

Implement role-based and organization-scoped authorization.

## Organization Roles

Support these roles:

```txt
Owner
Admin
Membership Manager
Finance Manager
Content Manager
Reviewer
```

## Permission Matrix

```txt
Permission                         Owner  Admin  Membership Manager  Finance Manager  Content Manager  Reviewer

View organization dashboard         Yes    Yes    Yes                 Yes              Yes              Yes
Update organization settings        Yes    Yes    No                  No               No               No
Manage memberships                  Yes    Yes    Yes                 No               No               No
Manage tiers                        Yes    Yes    Yes                 No               No               No
View applications                   Yes    Yes    Yes                 No               No               Yes
Review applications                 Yes    Yes    Yes                 No               No               Yes
Manage members                      Yes    Yes    Yes                 No               No               No
Post announcements                  Yes    Yes    No                  No               Yes              No
Manage announcements                Yes    Yes    No                  No               Yes              No
View finances                       Yes    Yes    No                  Yes              No               No
Manage finance records              Yes    Yes    No                  Yes              No               No
Invite admins                       Yes    Yes    No                  No               No               No
Change admin roles                  Yes    No     No                  No               No               No
Remove admins                       Yes    No     No                  No               No               No
View audit logs                     Yes    Yes    No                  No               No               No
```

Permission complexity can easily leak everywhere

The permission matrix is good, but the implementation must avoid repeated checks like this scattered everywhere:

if (role === "owner" || role === "admin" || role === "reviewer") {
  // ...
}

Instead, use a central permission map:

const rolePermissions = {
  owner: ["manage_memberships", "review_applications", "manage_finances"],
  admin: ["manage_memberships", "review_applications", "manage_finances"],
  reviewer: ["view_applications", "review_applications"],
} as const;

Then all routers and services call the same permission service.

## Required Procedure Types

Create reusable tRPC procedures:

```txt
publicProcedure
protectedProcedure
memberProcedure
organizationProcedure
organizationPermissionProcedure
platformAdminProcedure
```

## Authorization Rules

```txt
Never trust organization ID from the client without checking access
Organization admins can only access organizations where their admin status is active
Organization actions must check the specific permission required
Members can only access their own applications and memberships
Public users can only access published public content
```

## Senior Developer Expectations

The agent must centralize permission checks. Do not duplicate permission logic across routers. Do not rely on frontend hiding to protect data.

## Acceptance Criteria

```txt
Unauthorized organization access is blocked
Role permissions are enforced in tRPC procedures
Member data is scoped to the authenticated user
Organization data is scoped to the active organization admin
Permission helpers are unit tested
```

---

# Phase 7: App Layouts and Navigation

## Goal

Create route groups, layouts, and role-aware navigation.

## Layouts

```txt
PublicLayout
AuthLayout
OnboardingLayout
MemberDashboardLayout
OrganizationDashboardLayout
```

## Public Navigation

```txt
Home
Browse Memberships
Organizations
How It Works
Login
Register
```

## Member Navigation

```txt
Dashboard
Applications
Memberships
Browse
Saved
Notifications
Settings
```

## Organization Navigation

```txt
Dashboard
Applications
Memberships
Membership Tiers
Members
Announcements
Finances
Admins
Notifications
Settings
```

## Route Protection

Protect:

```txt
/member/*
/org/*
/onboarding/*
```

## Senior Developer Expectations

Layouts should be clean and composable. Do not duplicate sidebars or headers across pages. Use shared layout components.

## Acceptance Criteria

```txt
Public layout works
Auth layout works
Member dashboard layout works
Organization dashboard layout works
Navigation changes based on user role
Mobile navigation works
Protected routes redirect correctly
```

---

# Phase 8: Public Landing Page and Membership Discovery

## Goal

Build public marketplace browsing.

## Routes

```txt
/
 /memberships
 /memberships/[membershipSlug]
 /organizations
 /organizations/[organizationSlug]
 /organizations/[organizationSlug]/memberships/[membershipSlug]
```

## Landing Page Sections

```txt
Hero
Featured Organizations
Featured Memberships
Memberships Grouped by Organization
How It Works
Benefits for Members
Benefits for Organizations
Call to Action
Footer
```

## Membership Card Fields

Each card should show:

```txt
Membership name
Organization name
Short description
Starting price
Billing interval
Category
Number of active tiers
Status badge when useful
View details button
Apply button
```

## Search

Search public memberships by:

```txt
Membership name
Organization name
Short description
Full description
Category
Benefits
```

## Filters

Add filters for:

```txt
Category
Billing interval
Organization
Free memberships
Paid memberships
Newest
```

## Membership Detail Page

Show:

```txt
Membership name
Organization name
Description
Available active tiers
Benefits
Requirements
Application process summary
Public announcements when enabled
Apply button
Save button for authenticated members
```

## Anonymous Apply Behavior

When an anonymous user clicks Apply:

```txt
Redirect to login/register
After login, continue toward application flow when possible
```

## Senior Developer Expectations

Use server-rendered data where possible. Keep filters readable and predictable. Avoid overly complex search infrastructure in version one.

## Acceptance Criteria

```txt
Landing page displays real seeded organizations and memberships
Memberships are grouped by organization
Public memberships are searchable
Public memberships are filterable
Membership detail page works
Anonymous users are prompted to authenticate before applying
Archived memberships are hidden from public discovery
Draft memberships are hidden from public discovery
Paused memberships are visible but cannot receive applications
```

---

# Phase 9: Membership and Tier Management

## Goal

Allow organization admins with correct permissions to manage memberships and tiers.

## Routes

```txt
/org/[orgSlug]/memberships
/org/[orgSlug]/memberships/new
/org/[orgSlug]/memberships/[membershipId]
/org/[orgSlug]/memberships/[membershipId]/edit
/org/[orgSlug]/membership-tiers
/org/[orgSlug]/membership-tiers/new
/org/[orgSlug]/membership-tiers/[tierId]/edit
```

## Membership Fields

```txt
Name
Slug
Short description
Full description
Category
Visibility
Status
Application required
Public announcements enabled
Members-only content enabled
```

## Membership Status Rules

```txt
draft -> published
published -> paused
paused -> published
published -> archived
paused -> archived
draft -> archived
```

Rules:

```txt
Draft memberships are visible only to organization admins
Published public memberships are visible publicly
Paused memberships remain visible but cannot receive applications
Archived memberships are hidden from public discovery
Archived memberships cannot receive applications
```

## Tier Fields

```txt
Membership
Tier name
Description
Price
Currency
Billing interval
Benefits
Requirements
Maximum members
Sort order
Status
```

## Tier Rules

```txt
Only active tiers show publicly
Inactive tiers do not show publicly
Archived tiers are preserved for history
Price must be non-negative
Free tiers must have price 0
A member must select a tier when multiple active tiers exist
```

## Senior Developer Expectations

Keep membership and tier service logic separate. Do not put status transition rules inside React components. Validate transitions on the server.

## Acceptance Criteria

```txt
Authorized admins can create memberships
Authorized admins can edit memberships
Authorized admins can publish memberships
Authorized admins can pause memberships
Authorized admins can archive memberships
Authorized admins can create tiers
Authorized admins can edit tiers
Authorized admins can disable tiers
Unauthorized roles cannot mutate memberships or tiers
Public pages only show eligible memberships and tiers
```

---

# Phase 10: Member Application Flow

## Goal

Allow members to apply to a membership tier.

## Routes

```txt
/member/applications
/member/applications/[applicationId]
/memberships/[membershipSlug]/apply
/organizations/[organizationSlug]/memberships/[membershipSlug]/apply
```

## Application Input Fields

Use a simple application questionnaire:

```txt
Selected tier
Applicant name
Applicant email
Phone
Reason for applying
Relevant background
Additional notes
Agreement checkbox
```

Store answers as structured JSON in `membership_applications.answers`.

## Application Flow

```txt
1. Member opens membership detail page
2. Member clicks Apply
3. Member selects tier
4. Member completes questionnaire
5. Member saves draft or submits
6. Submitted application status becomes submitted
7. Organization receives notification
8. Member can view application status
```

## Application Statuses

```txt
draft
submitted
under_review
needs_information
approved
rejected
withdrawn
cancelled
```

## Member Actions

```txt
Create draft application
Edit draft application
Submit application
Withdraw submitted application
View status
View review notes when available
Respond when more information is requested
```

## Duplicate Rules

```txt
A member cannot submit multiple active applications to the same membership
A member cannot apply to archived memberships
A member cannot apply to paused memberships
A member cannot apply to private memberships unless permitted
A member cannot apply if they already have an active membership for that membership
```

## Senior Developer Expectations

Application state transitions must be centralized in an `ApplicationService`. Do not allow arbitrary status updates from the UI.

## Acceptance Criteria

```txt
Members can save draft applications
Members can submit applications
Members can view applications
Members can withdraw eligible applications
Duplicate active applications are blocked
Application submission creates organization notification
Application permissions are enforced server-side
```

---

# Phase 11: Organization Application Review

## Goal

Allow organization admins with review permission to process applications.

## Routes

```txt
/org/[orgSlug]/applications
/org/[orgSlug]/applications/[applicationId]
```

## Applications List

Columns:

```txt
Applicant
Membership
Tier
Status
Submitted date
Last updated
Actions
```

Filters:

```txt
Status
Membership
Tier
Submitted date
```

Search:

```txt
Applicant name
Applicant email
Membership name
Tier name
```

## Application Detail Page

Show:

```txt
Applicant profile
Membership
Selected tier
Submitted answers
Application status
Application history
Internal review notes
Approve button
Reject button
Request more information button
```

## Review Actions

### Mark Under Review

Allowed:

```txt
submitted -> under_review
```

### Approve

Allowed:

```txt
submitted -> approved
under_review -> approved
```

Approval must:

```txt
Update application status to approved
Set reviewedAt
Set reviewedByUserId
Create membership_members record
Set membership member status to active or pending_payment
Create member notification
Create audit log
```

### Reject

Allowed:

```txt
submitted -> rejected
under_review -> rejected
```

Rejection must:

```txt
Require review note
Update application status to rejected
Set reviewedAt
Set reviewedByUserId
Create member notification
Create audit log
```

### Request More Information

Allowed:

```txt
submitted -> needs_information
under_review -> needs_information
```

This must:

```txt
Require message
Create member notification
Allow member to update answers
Return application to submitted after member resubmits
```

## Senior Developer Expectations

Use database transactions for approval because it updates multiple records. Never create an active membership without a valid approved application.

## Acceptance Criteria

```txt
Authorized reviewers can view organization applications
Authorized reviewers can approve applications
Authorized reviewers can reject applications
Authorized reviewers can request more information
Approval creates active membership record
Review actions create notifications
Review actions create audit logs
Unauthorized roles cannot review applications
```

---

# Phase 12: Member Dashboard and Active Membership Area

## Goal

Build the member experience after login.

## Routes

```txt
/member/dashboard
/member/applications
/member/applications/[applicationId]
/member/memberships
/member/memberships/[membershipId]
/member/browse
/member/saved
/member/notifications
/member/settings
```

## Dashboard Widgets

Show:

```txt
Active memberships count
Pending applications count
Approved applications count
Rejected applications count
Saved memberships count
Latest announcements from active memberships
Recommended public memberships
Recent activity
```

## Applications Page

Show:

```txt
Membership
Organization
Tier
Status
Submitted date
Last updated
Actions
```

## Memberships Page

Show active memberships as cards or table rows:

```txt
Membership name
Organization
Tier
Status
Started date
Expiry date if any
Payment status
Actions
```

## Member Membership Detail

Tabs:

```txt
Overview
Announcements
Billing
Contact
```

Overview shows:

```txt
Membership description
Tier benefits
Tier requirements
Membership status
Started date
Organization contact
```

## Access Rules

```txt
Member can only see their own applications
Member can only see their own active memberships
Member can only see members-only announcements for memberships they belong to
Member cannot access private content for memberships they have not joined
```

## Senior Developer Expectations

Do not expose organization-only data in member routes. Keep member queries scoped by authenticated user ID.

## Acceptance Criteria

```txt
Member dashboard displays correct scoped metrics
Member applications page works
Member memberships page works
Member membership detail page works
Private membership content is protected
Empty states are implemented
Loading states are implemented
```

---

# Phase 13: Organization Dashboard and Member Management

## Goal

Build the organization management experience.

## Routes

```txt
/org/[orgSlug]/dashboard
/org/[orgSlug]/members
/org/[orgSlug]/members/[memberId]
```

## Dashboard Widgets

Show:

```txt
Total active members
Pending applications
Approved applications
Rejected applications
Published memberships
Paused memberships
Monthly demo revenue
Recent applications
Recent members
Recent comments
Recent finance records
```

## Quick Actions

Show only when user has permission:

```txt
Create membership
Create tier
Review applications
Post announcement
Invite admin
Record finance transaction
```

## Members Page

Columns:

```txt
Name
Email
Membership
Tier
Status
Joined date
Payment status
Actions
```

Filters:

```txt
Membership
Tier
Status
Joined date
Payment status
```

Actions:

```txt
View profile
Change status
Change tier
Suspend member
Reactivate member
Cancel membership
```

## Member Detail Page

Show:

```txt
Profile information
Membership history
Applications
Demo finance records
Comments/activity
Admin notes section
```

## Senior Developer Expectations

Organization metrics must be scoped to the organization. Do not calculate dashboard metrics on the client when they can be queried safely on the server.

## Acceptance Criteria

```txt
Organization dashboard works
Metrics are organization-scoped
Quick actions respect permissions
Members list works
Member detail page works
Authorized admins can suspend members
Authorized admins can reactivate members
Authorized admins can cancel memberships
Unauthorized roles cannot manage members
```

---

# Phase 14: Announcements, Likes, and Comments

## Goal

Allow organization admins to publish announcements and members to interact.

## Routes

```txt
/org/[orgSlug]/announcements
/org/[orgSlug]/announcements/new
/org/[orgSlug]/announcements/[announcementId]
/org/[orgSlug]/announcements/[announcementId]/edit
```

Member-facing announcements appear inside:

```txt
/member/memberships/[membershipId]
```

Public announcements can appear on:

```txt
/memberships/[membershipSlug]
/organizations/[organizationSlug]/memberships/[membershipSlug]
```

## Announcement Fields

```txt
Membership
Title
Body
Visibility
Status
Pinned
Published date
```

## Visibility Rules

```txt
public: visible on public membership detail page
members_only: visible only to active members of that membership
tier_specific: visible only to active members of selected tier
admins_only: visible only to organization admins
```

## Admin Actions

```txt
Create announcement
Edit draft announcement
Publish announcement
Archive announcement
Pin announcement
Unpin announcement
View likes
View comments
Hide comments
```

## Member Actions

```txt
View eligible announcements
Like announcement
Unlike announcement
Comment on announcement
Delete own comment
Reply one level deep
View pinned announcements first
Filter newest/pinned
```

## Like Rules

```txt
Each user can like an announcement once
Like again should unlike or be blocked depending on UI choice
Likes must be unique by announcementId + userId
Use optimistic UI only if rollback is handled
```

## Comment Rules

```txt
Comment body cannot be empty
Members can only comment on announcements they can view
Members can delete their own comments
Admins can hide comments
Hidden comments are not visible to members
Deleted comments show as deleted or disappear from normal view
```

## Senior Developer Expectations

Do not trust the client to decide whether a user can see or interact with an announcement. Check access on every announcement, like, and comment query/mutation.

## Acceptance Criteria

```txt
Admins can publish announcements
Members can see eligible announcements
Public users can see public announcements only
Members can like announcements
Members can unlike announcements
Members can comment
Members can delete their own comments
Admins can hide comments
Pinned announcements appear first
Unauthorized users cannot interact with restricted announcements
```

---

# Phase 15: Demo Finances

## Goal

Create a finance area for demo tracking without payment processing.

## Routes

```txt
/org/[orgSlug]/finances
/org/[orgSlug]/finances/new
/org/[orgSlug]/finances/[transactionId]
```

## Finance Dashboard

Show:

```txt
Total demo revenue
Monthly demo revenue
Pending amount
Failed amount
Revenue by membership
Revenue by tier
Recent transactions
```

## Finance Table Columns

```txt
Date
Member
Membership
Tier
Amount
Currency
Type
Status
Provider
Reference
Actions
```

## Finance Transaction Fields

```txt
Organization
Membership
Tier
Member
Type
Status
Amount
Currency
Provider
Provider reference
Description
```

## Types

```txt
membership_payment
refund
adjustment
payout
fee
```

## Statuses

```txt
pending
successful
failed
refunded
cancelled
```

## Provider Values

```txt
manual
cash
eft
demo
```

## Rules

```txt
Only users with finance permissions can view finances
Only users with finance permissions can create finance records
Amounts must be non-negative
Revenue summaries only count successful membership_payment records
Refunded records should reduce totals only if explicitly modeled that way
Finance records must be organization-scoped
```

## Senior Developer Expectations

Keep this as demo finance tracking. Do not add checkout, external provider logic, webhooks, invoices, receipts, or billing automation.

## Acceptance Criteria

```txt
Finance dashboard displays demo metrics
Finance table supports search
Finance table supports filters
Authorized users can create finance records
Authorized users can view transaction detail
Unauthorized users cannot access finances
Finance metrics are organization-scoped
```

---

# Phase 16: Organization Admins and Role Management

## Goal

Allow owners and admins to manage organization admins according to permissions.

## Routes

```txt
/org/[orgSlug]/admins
/org/[orgSlug]/admins/invite
```

## Admins Table

Columns:

```txt
Name
Email
Role
Status
Invited date
Actions
```

## Actions

```txt
Invite admin
Change role
Remove admin
Resend invite
Cancel invite
```

## Invite Flow

```txt
1. Owner or permitted admin enters email
2. User selects role
3. System creates organization_admins record with status invited
4. System creates notification if invited user already exists
5. If email sending is configured, send invite email through app email service
6. Invited user accepts
7. Admin status becomes active
```

## Role Safety Rules

```txt
Only owner can change admin roles
Only owner can remove admins
Owner cannot remove the final active owner
Non-owners cannot assign owner role
Removed admins lose access immediately
Invited admins cannot access organization until active
```

## Senior Developer Expectations

Admin role changes are sensitive. Use transactions and audit logs. Make sure the final owner cannot be removed.

## Acceptance Criteria

```txt
Owners can invite admins
Owners can change admin roles
Owners can remove admins
Owners cannot remove the final owner
Admins can invite only if permitted
Removed admins lose access
Admin actions create audit logs
```

---

# Phase 17: Notifications

## Goal

Add in-app notifications for important product events.

## Routes

```txt
/member/notifications
/org/[orgSlug]/notifications
```

## Shared UI

Add:

```txt
Notification bell
Unread count
Notifications dropdown
Notifications page
Mark as read
Mark all as read
```

## Member Notification Events

```txt
Application submitted
Application under review
More information requested
Application approved
Application rejected
New announcement posted
Comment reply received
Payment record marked successful
Payment record marked failed
Membership suspended
Membership reactivated
Membership cancelled
```

## Organization Notification Events

```txt
New application submitted
Application updated by member
New comment on announcement
New like on announcement
New member activated
Finance record created
Admin invited
Admin accepted invite
```

## Notification Data

Each notification should include:

```txt
User ID
Type
Title
Body
Optional metadata
Read timestamp
Created timestamp
```

## Rules

```txt
Notifications are scoped to one user
Organization notifications should be sent to relevant admins based on permission
Notification creation should happen inside service methods after important actions
Do not create duplicate notifications for the same event unless intentional
```

## Senior Developer Expectations

Do not scatter notification creation randomly across routers. Use a `NotificationService`.

## Acceptance Criteria

```txt
Notifications are created for major events
Users can view notifications
Users can mark one notification as read
Users can mark all notifications as read
Unread count works
Notification access is scoped correctly
```

---

# Phase 18: Search, Filters, Pagination, and Tables

## Goal

Make main list pages usable and consistent.

## Add Search To

```txt
Public memberships
Organizations
Member applications
Member memberships
Organization applications
Organization members
Organization finance transactions
Organization announcements
Notifications
```

## Add Filters To Applications

```txt
Status
Membership
Tier
Date submitted
```

## Add Filters To Members

```txt
Status
Membership
Tier
Joined date
Payment status
```

## Add Filters To Finances

```txt
Status
Date range
Membership
Tier
Transaction type
Provider
```

## Add Filters To Announcements

```txt
Status
Visibility
Membership
Pinned
```

## Data Table Requirements

Reusable table must support:

```txt
Search
Filters
Pagination
Sorting
Row actions
Empty state
Loading state
Error state
```

## Senior Developer Expectations

Do not build a new table implementation for every page. Create reusable table patterns and page-specific column definitions.

## Acceptance Criteria

```txt
Main lists are searchable
Main lists are filterable
Main lists support pagination
Main lists support sorting where useful
Empty states are polished
Loading states are consistent
Errors are displayed clearly
```

---

# Phase 19: API Architecture and Service Layer

## Goal

Organize the backend into maintainable domain routers and services.

## Routers

Create:

```txt
authRouter
userRouter
organizationRouter
organizationAdminRouter
membershipRouter
membershipTierRouter
applicationRouter
memberRouter
announcementRouter
commentRouter
likeRouter
financeRouter
notificationRouter
searchRouter
```

## Services

Create:

```txt
UserService
OrganizationService
PermissionService
MembershipService
MembershipTierService
ApplicationService
MemberService
AnnouncementService
CommentService
LikeService
FinanceService
NotificationService
AuditLogService
```

## Router Rules

Routers should:

```txt
Validate input
Call service methods
Return typed responses
Avoid complex business logic
Use reusable protected procedures
```

## Service Rules

Services should:

```txt
Own business logic
Own status transitions
Create audit logs
Create notifications
Use transactions for multi-step operations
Protect against invalid state changes
```

## Senior Developer Expectations

Keep API logic predictable. A senior developer should be able to open a router and understand what service method is responsible for the business behavior.

## Acceptance Criteria

```txt
Routers are organized by domain
Services contain business logic
Protected procedures enforce authentication
Organization procedures enforce organization access
Permission procedures enforce role permissions
API responses are typed end-to-end
```

---

# Phase 20: Validation and Error Handling

## Goal

Add shared validation and consistent error behavior.

## Validator Files

Create shared validators for:

```txt
Register
Login
Organization create/update
Membership create/update
Tier create/update
Application draft
Application submit
Application review
Announcement create/update
Comment create
Finance transaction create
Admin invite
Notification update
```

## Validation Rules

Examples:

```txt
Email must be valid
Organization name is required
Organization slug must be valid
Membership name is required
Membership slug must be valid
Tier price must be non-negative
Free tier must have price 0
Application reason is required on submit
Review note is required when rejecting
Announcement title is required
Announcement body is required before publishing
Comment body cannot be empty
Finance amount must be non-negative
Admin role must be valid
```

## Error Handling

Use consistent error types:

```txt
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
BAD_REQUEST
CONFLICT
VALIDATION_ERROR
INTERNAL_SERVER_ERROR
```

## Senior Developer Expectations

Validation must exist on the server even if the client validates too. Never trust client input.

## Acceptance Criteria

```txt
Client forms validate before submit
tRPC procedures validate inputs
Validation messages are user-friendly
Server errors are consistent
Invalid data cannot be saved
```

---

# Phase 21: Security and Data Protection

## Goal

Protect private user, member, and organization data.

## Security Requirements

```txt
All protected routes require authentication
All organization data must be organization-scoped
All member data must be user-scoped
All tRPC inputs must be validated
All sensitive mutations must check permissions
Public users cannot access private content
Members cannot access another member's applications
Organizations cannot access another organization's data
Users cannot comment on announcements they cannot view
Users cannot like announcements they cannot view
Duplicate likes are prevented
Duplicate active applications are prevented
Duplicate active memberships are prevented
Audit logs are created for sensitive actions
```

## Senior Developer Expectations

Security must be implemented server-side. UI conditions are only for user experience, not protection.

## Acceptance Criteria

```txt
Unauthorized requests fail
Forbidden requests fail
Cross-organization access is blocked
Cross-user member access is blocked
Sensitive actions create audit logs
Permission tests pass
```

---

# Phase 22: Seed Data

## Goal

Create realistic local demo data.

## Seed Data

Create:

```txt
3 organizations
8 memberships
15 membership tiers
8 member users
3 organization owner users
6 organization admin users with different roles
15 applications
8 active memberships
10 announcements
30 comments
50 likes
40 notifications
30 finance transactions
20 audit log entries
```

## Sample Organizations

```txt
LulaFi Business Network
Creative Professionals Association
Wellness Members Club
```

## Sample Memberships

```txt
Startup Founder Circle
Small Business Growth Club
Premium Wellness Access
Student Creative Network
Professional Design Guild
Local Entrepreneur Network
Health Coaching Circle
Creative Partner Access
```

## Demo Finance Examples

```txt
Successful membership payment
Pending membership payment
Failed membership payment
Refund record
Manual adjustment
Demo payout
```

## Senior Developer Expectations

Seed data should exercise the UI. Dashboards, filters, empty states, and detail pages should all have realistic data.

## Acceptance Criteria

```txt
Seed script runs successfully
Landing page looks populated
Member dashboard has realistic data
Organization dashboard has realistic data
Applications can be reviewed
Announcements have likes and comments
Finance dashboard has demo metrics
```

---

# Phase 23: Testing

## Goal

Add reliable coverage for critical business flows.

## Unit Tests

Test:

```txt
Permission checks
Application status transitions
Membership visibility rules
Tier validation
Notification creation
Finance summary calculations
Announcement access rules
Comment permissions
Like uniqueness behavior
```

## Integration Tests

Test:

```txt
Register through Better Auth flow
Select member role
Create organization
Create membership
Create tier
Submit application
Approve application
Create active membership
Post announcement
Like announcement
Comment on announcement
Create finance record
Invite admin
Change admin role
```

## End-to-End Tests

Test:

```txt
Anonymous user browses memberships
Member applies to membership
Organization approves application
Member views active membership
Organization posts announcement
Member likes and comments on announcement
Finance manager views finance page
Reviewer can review applications but cannot manage finances
Content manager can post announcements but cannot manage tiers
```

## Senior Developer Expectations

Test business logic first. Do not rely only on end-to-end tests. Permission and status transition bugs should be caught at the unit or integration level.

## Acceptance Criteria

```txt
Core service tests pass
Permission tests pass
Main user flow tests pass
CI can run tests
Failed tests block merge
```

---

# Recommended Build Order

Build in this order:

```txt
1. Project foundation
2. Design system and shared UI
3. Database schema
4. Better Auth integration
5. Onboarding
6. Permissions
7. Layouts and navigation
8. Public browsing
9. Membership and tier management
10. Member application flow
11. Organization application review
12. Active memberships
13. Member dashboard
14. Organization dashboard
15. Announcements
16. Likes and comments
17. Demo finances
18. Organization admins
19. Notifications
20. Search, filters, and pagination
21. Testing
22. Deployment preparation
```

---

# First Usable Version Scope

The first usable version is complete only when this flow works end-to-end:

```txt
1. User registers through Better Auth
2. User selects organization role
3. User creates organization
4. User creates membership
5. User creates membership tier
6. Membership appears publicly
7. Second user registers through Better Auth
8. Second user selects member role
9. Member applies to membership tier
10. Organization admin reviews application
11. Organization admin approves application
12. Member receives notification
13. Active membership is created
14. Member opens active membership
15. Organization admin posts announcement
16. Member reads announcement
17. Member likes announcement
18. Member comments on announcement
19. Organization sees member in members list
20. Finance manager creates demo finance record
21. Finance dashboard displays demo metrics
```

Every implementation decision should support this flow first.
