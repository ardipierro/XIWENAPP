# 📘 XIWENAPP V2 - Coding Guidelines

## Purpose

This document defines **strict coding standards** for the XIWENAPP V2 refactor. These rules are enforced by ESLint and must be followed for all new code.

**Philosophy:**
- Constraints improve code quality
- Consistency over individual preference
- Automated enforcement reduces review time
- Small components are better components

---

## 🎨 1. Styling Rules

### ✅ DO: Use 100% Tailwind CSS

```jsx
// ✅ GOOD
<div className="bg-primary-900 text-white p-md rounded-lg">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

```jsx
// ❌ BAD - No CSS imports!
import './MyComponent.css';

<div className="my-custom-class">
  <h1>Title</h1>
</div>
```

### ✅ DO: Use the 3-Color System

```jsx
// ✅ GOOD - Using primary, accent, neutral
<button className="bg-accent-500 hover:bg-accent-600 text-white">
  Save
</button>

<p className="text-neutral-500">Secondary text</p>
```

```jsx
// ❌ BAD - Using colors outside the system
<button className="bg-blue-500">  // ❌ No blue!
  Save
</button>

<p className="text-purple-600">  // ❌ No purple!
  Secondary text
</p>
```

### ✅ DO: Use Semantic Color Aliases

```jsx
// ✅ GOOD - Semantic and readable
<div className="bg-bg-primary text-text-primary border border-border">
  Content
</div>

<button className="bg-accent-500">Action</button>
```

### Color Quick Reference

| Use Case | Light Mode | Dark Mode |
|----------|------------|-----------|
| Main background | `bg-bg-primary` | `dark:bg-bg-dark` |
| Cards/panels | `bg-bg-secondary` | `dark:bg-primary-800` |
| Primary text | `text-text-primary` | `dark:text-text-inverse` |
| Secondary text | `text-text-secondary` | `dark:text-neutral-400` |
| Muted text | `text-text-muted` | `dark:text-neutral-500` |
| Borders | `border-border` | `dark:border-border-dark` |
| Primary button | `bg-accent-500` | `dark:bg-accent-600` |
| Hover states | `hover:bg-accent-600` | - |
| Disabled | `bg-neutral-300 text-neutral-500` | - |

---

## 📦 2. Component Structure

### File Size Limits (ENFORCED)

```javascript
// ESLint enforced
max-lines: 300               // Max 300 lines per file
max-lines-per-function: 50   // Max 50 lines per function
```

### Component Template

```jsx
// MyComponent.jsx
import { useState } from 'react';
import { BaseButton, BaseCard } from './common';
import { someHelper } from '../utils';

/**
 * MyComponent - Brief description
 *
 * @param {Object} props
 * @param {string} props.title - Title to display
 * @param {Function} props.onAction - Action handler
 * @returns {JSX.Element}
 */
function MyComponent({ title, onAction }) {
  const [state, setState] = useState(null);

  // Event handlers
  const handleClick = () => {
    onAction?.();
  };

  // Render helpers (if needed)
  const renderContent = () => (
    <p className="text-text-secondary">Content</p>
  );

  return (
    <BaseCard>
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      {renderContent()}
      <BaseButton onClick={handleClick}>Action</BaseButton>
    </BaseCard>
  );
}

export default MyComponent;
```

### ✅ DO: Split Large Components

```jsx
// ❌ BAD - 500 line component
function Dashboard() {
  // ... 500 lines of code
}

// ✅ GOOD - Split into smaller components
function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
      <DashboardActions />
    </DashboardLayout>
  );
}
```

### ✅ DO: Extract Complex Logic to Hooks

```jsx
// ❌ BAD - Business logic in component
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 50 lines of fetch logic...
  }, []);

  return <div>...</div>;
}

// ✅ GOOD - Logic in custom hook
function UserList() {
  const { users, loading, error, refresh } = useUsers();

  return <div>...</div>;
}
```

---

## 🧩 3. Base Template Usage

### Always Use Base Templates

```jsx
// ❌ BAD - Custom modal
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h2>Title</h2>
      <button>×</button>
    </div>
    <div className="modal-body">
      Content
    </div>
    <div className="modal-footer">
      <button>Cancel</button>
      <button>Save</button>
    </div>
  </div>
</div>

// ✅ GOOD - Use BaseModal
<BaseModal
  title="Title"
  isOpen={isOpen}
  onClose={handleClose}
  footer={
    <>
      <BaseButton variant="secondary" onClick={handleClose}>
        Cancel
      </BaseButton>
      <BaseButton variant="primary" onClick={handleSave}>
        Save
      </BaseButton>
    </>
  }
>
  Content
</BaseModal>
```

### Base Template Reference

| Use Case | Template | Import |
|----------|----------|--------|
| Modal dialog | `<BaseModal>` | `import { BaseModal } from '@/components/base'` |
| Side panel | `<BasePanel>` | `import { BasePanel } from '@/components/base'` |
| Data table | `<BaseTable>` | `import { BaseTable } from '@/components/base'` |
| Card/Box | `<BaseCard>` | `import { BaseCard } from '@/components/base'` |
| Button | `<BaseButton>` | `import { BaseButton } from '@/components/base'` |

---

## 📁 4. File Organization

### Directory Structure

```
src/
├── components/
│   ├── base/              → 4 base templates only
│   ├── layout/            → Layout components (TopBar, SideMenu)
│   └── features/          → Feature-specific components
├── screens/               → Route-level components
│   ├── admin/
│   ├── teacher/
│   └── student/
├── hooks/                 → Custom React hooks
├── utils/                 → Pure utility functions
├── firebase/              → Firebase integration (NO CHANGES)
├── services/              → Business logic services
└── config/                → App configuration
```

### Naming Conventions

```
Components:     PascalCase      MyComponent.jsx
Hooks:          camelCase       useMyHook.js
Utils:          camelCase       myUtility.js
Constants:      UPPER_SNAKE     MY_CONSTANT
CSS Classes:    kebab-case      my-class-name (DON'T USE - Use Tailwind!)
```

### File Naming

```
✅ GOOD
UserList.jsx
useUsers.js
userHelpers.js
USER_ROLES.js

❌ BAD
user-list.jsx       // Wrong case
Users_Component.jsx // Mixed case
myHook.js          // Should be useMyHook.js
```

---

## 🎯 5. Props & State Management

### Props Destructuring

```jsx
// ✅ GOOD - Destructure in function params
function MyComponent({ title, count, onAction }) {
  return <div>{title}</div>;
}

// ❌ BAD - Using props object
function MyComponent(props) {
  return <div>{props.title}</div>;
}
```

### Prop Types (TypeScript or JSDoc)

```jsx
/**
 * @typedef {Object} MyComponentProps
 * @property {string} title - The title
 * @property {number} [count] - Optional count
 * @property {() => void} onAction - Action callback
 */

/** @param {MyComponentProps} props */
function MyComponent({ title, count = 0, onAction }) {
  // ...
}
```

### State Naming

```jsx
// ✅ GOOD - Clear naming
const [isOpen, setIsOpen] = useState(false);
const [users, setUsers] = useState([]);
const [selectedId, setSelectedId] = useState(null);

// ❌ BAD - Unclear naming
const [open, setOpen] = useState(false);      // What is open?
const [data, setData] = useState([]);         // What data?
const [selected, setSelected] = useState(null); // Selected what?
```

---

## 🔄 6. React Best Practices

### Event Handlers

```jsx
// ✅ GOOD - Descriptive names, arrow functions for inline
const handleSubmit = (e) => {
  e.preventDefault();
  // ...
};

const handleUserClick = (userId) => {
  // ...
};

<button onClick={handleSubmit}>Submit</button>
<button onClick={() => handleUserClick(user.id)}>View</button>

// ❌ BAD
const submit = () => {}; // Not prefixed with 'handle'
<button onClick={submit()}>Submit</button> // Called immediately!
```

### useEffect Dependencies

```jsx
// ✅ GOOD - All dependencies listed
useEffect(() => {
  fetchData(userId);
}, [userId]); // userId is listed

// ❌ BAD - Missing dependencies (ESLint will warn)
useEffect(() => {
  fetchData(userId);
}, []); // userId not listed!
```

### Conditional Rendering

```jsx
// ✅ GOOD - Clear and concise
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
{users.length === 0 ? (
  <EmptyState />
) : (
  <UserList users={users} />
)}

// ❌ BAD - Nested ternaries
{isLoading ? <LoadingSpinner /> : error ? <ErrorMessage /> : users.length === 0 ? <EmptyState /> : <UserList />}
```

---

## 🚫 7. What NOT to Do

### ❌ DON'T: Import CSS Files

```jsx
// ❌ NEVER DO THIS
import './MyComponent.css';
import styles from './MyComponent.module.css';

// ✅ DO THIS INSTEAD
// Use Tailwind classes inline
<div className="bg-primary-900 p-md rounded-lg">
```

### ❌ DON'T: Use Inline Styles

```jsx
// ❌ BAD
<div style={{ backgroundColor: '#18181b', padding: '16px' }}>

// ✅ GOOD
<div className="bg-primary-900 p-4">
```

### ❌ DON'T: Create Giant Components

```jsx
// ❌ BAD - 500+ line component
function Dashboard() {
  // 500 lines of code
}

// ✅ GOOD - Split into smaller components (<300 lines each)
```

### ❌ DON'T: Use console.log in Production

```jsx
// ❌ BAD
console.log('Debug info');

// ✅ GOOD - Use logger
import logger from '@/utils/logger';
logger.debug('Debug info');
```

### ❌ DON'T: Use Magic Numbers

```jsx
// ❌ BAD
if (user.role === 3) {
  // What is 3?
}

// ✅ GOOD
const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

if (user.role === ROLES.ADMIN) {
  // Clear!
}
```

---

## ✅ 8. Code Review Checklist

Before submitting a PR, check:

- [ ] ✅ No CSS imports (100% Tailwind)
- [ ] ✅ Only uses 3-color system (primary, accent, neutral)
- [ ] ✅ Component <300 lines
- [ ] ✅ Functions <50 lines
- [ ] ✅ Uses base templates where applicable
- [ ] ✅ Props are documented (JSDoc or TypeScript)
- [ ] ✅ No console.log statements
- [ ] ✅ All useEffect dependencies listed
- [ ] ✅ Meaningful variable names
- [ ] ✅ Error boundaries implemented
- [ ] ✅ Loading states handled
- [ ] ✅ Empty states handled
- [ ] ✅ Mobile responsive (tested)
- [ ] ✅ Dark mode works correctly
- [ ] ✅ No ESLint errors or warnings

---

## 🛠️ 9. Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Write Code Following Guidelines

```jsx
// Small, focused components
// 100% Tailwind
// Use base templates
```

### 3. Run Linter

```bash
npm run lint
```

Fix all errors before committing!

### 4. Test Locally

```bash
npm run dev
```

Test:
- ✅ Light mode
- ✅ Dark mode
- ✅ Mobile (320px - 480px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (1280px+)

### 5. Commit & Push

```bash
git add .
git commit -m "feat: Add user management screen"
git push origin feature/my-feature
```

### 6. Create PR

- Link to issue/task
- Add screenshots
- Describe changes
- Tag reviewers

---

## 📚 10. Quick Examples

### Example 1: Simple Screen

```jsx
// src/screens/admin/UsersScreen.jsx
import { useState } from 'react';
import { BaseTable, BaseButton, BaseModal } from '@/components/base';
import { useUsers } from '@/hooks/useUsers';

function UsersScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { users, loading, deleteUser } = useUsers();

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <BaseButton onClick={() => setIsModalOpen(true)}>
          Add User
        </BaseButton>
      </div>

      <BaseTable
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={(user) => console.log(user)}
      />

      <BaseModal
        title="Add User"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        {/* Add user form */}
      </BaseModal>
    </div>
  );
}

export default UsersScreen;
```

### Example 2: Custom Hook

```jsx
// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { getAllUsers } from '@/firebase/users';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    // Delete logic
  };

  return { users, loading, error, deleteUser, refresh: loadUsers };
}
```

### Example 3: Base Component Usage

```jsx
// Using BaseCard
<BaseCard
  title="Statistics"
  subtitle="Last 30 days"
  footer={
    <BaseButton variant="secondary" size="sm">
      View Details
    </BaseButton>
  }
>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-text-muted text-sm">Total Users</p>
      <p className="text-2xl font-bold text-text-primary">1,234</p>
    </div>
    <div>
      <p className="text-text-muted text-sm">Active</p>
      <p className="text-2xl font-bold text-accent-500">987</p>
    </div>
  </div>
</BaseCard>
```

---

## 🎓 11. Learning Resources

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

### React Best Practices
- [React Docs](https://react.dev/)
- [React Hooks Guide](https://react.dev/reference/react)

### Component Patterns
- [Component Composition](https://react.dev/learn/passing-props-to-a-component)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## ❓ FAQ

**Q: Can I use a color outside the 3-color system for a special case?**
A: No. If you truly need it, discuss with the team first and update this doc.

**Q: What if my component needs to be >300 lines?**
A: Split it. Extract sub-components or move logic to hooks/utils.

**Q: Can I add a new base template?**
A: Yes, but discuss with team first. We want to keep the number minimal.

**Q: How do I handle forms?**
A: Use BaseInput, BaseSelect, etc. (to be created in Phase 1).

**Q: What about existing CSS files?**
A: They will be removed in Phase 5. For now, don't add new ones.

---

*Document Version: 1.0*
*Created: 2025-01-07*
*Next Review: After Phase 1 completion*
