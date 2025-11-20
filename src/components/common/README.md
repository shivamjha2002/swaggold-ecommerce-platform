# Swati Gold Common Components

This directory contains reusable UI components that follow the Swati Gold brand design system.

## Components

### Logo
Brand logo component with icon and text variants.

```tsx
import { Logo } from '@/components/common';

<Logo variant="full" size="md" />
<Logo variant="icon" size="lg" />
<Logo variant="text" size="sm" />
```

### Button
Reusable button with multiple variants and states.

```tsx
import { Button } from '@/components/common';

<Button variant="primary">Click Me</Button>
<Button variant="outline" size="lg" loading>Loading...</Button>
```

### Input
Form input with label, error states, and icons.

```tsx
import { Input } from '@/components/common';

<Input label="Email" type="email" error="Invalid email" />
<Input type="password" placeholder="Password" />
```

### Card
Container component with multiple variants.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common';

<Card variant="gold" hoverable>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Modal
Accessible modal dialog component.

```tsx
import { Modal, ModalFooter } from '@/components/common';

<Modal isOpen={isOpen} onClose={handleClose} title="Modal Title">
  <p>Modal content</p>
  <ModalFooter>
    <Button onClick={handleClose}>Close</Button>
  </ModalFooter>
</Modal>
```

### ErrorMessage
Display user-friendly error messages with optional retry functionality.

```tsx
import { ErrorMessage, ErrorMessageCard, ErrorMessageBanner } from '@/components/common';

// Inline error (for forms)
<ErrorMessage message="Invalid email format" variant="inline" />

// Card error (for sections)
<ErrorMessageCard message="Failed to load data" onRetry={handleRetry} />

// Banner error (for page-level errors)
<ErrorMessageBanner message="Unable to connect to server" onRetry={handleRetry} />
```

### LoadingState
Wrapper component that handles loading, error, and success states.

```tsx
import { LoadingState } from '@/components/common';

<LoadingState 
  loading={loading} 
  error={error} 
  onRetry={retry}
  loadingText="Loading products..."
>
  <ProductList products={products} />
</LoadingState>
```

## Design System

See `src/utils/colors.ts` for the complete color palette and design tokens.
