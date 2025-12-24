# Modal Component - Usage Guide

A fully dynamic, reusable modal component for Yatra that supports API data, static content, loading states, and error handling.

## Features

- ✅ **Dynamic Content**: Accept any React component or HTML content
- ✅ **Loading States**: Built-in skeleton loader with custom skeleton support
- ✅ **Error Handling**: Automatic error display with custom error components
- ✅ **Flexible Sizing**: 5 size options (sm, md, lg, xl, full)
- ✅ **Dark Mode**: Full dark mode support
- ✅ **Accessibility**: Keyboard navigation, ARIA labels, focus management
- ✅ **Portal Rendering**: Renders outside DOM hierarchy for proper z-index
- ✅ **Custom Z-Index**: Override default z-index for special cases
- ✅ **Header/Footer Control**: Show/hide header and footer independently

## Basic Usage

```tsx
import { Modal } from '../components/ui/modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="My Modal Title"
    >
      <p>Modal content goes here</p>
    </Modal>
  );
}
```

## With API Data Loading

```tsx
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/endpoint');
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Data Details"
      loading={loading}
      error={error}
    >
      {data && (
        <div>
          <p>{data.name}</p>
          <p>{data.description}</p>
        </div>
      )}
    </Modal>
  );
}
```

## With Custom Loading Skeleton

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Loading Data"
  loading={isLoading}
  loadingSkeleton={
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  }
>
  {/* Your content */}
</Modal>
```

## With Custom Error Component

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Error Occurred"
  error={errorMessage}
  errorComponent={
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 dark:text-gray-400">{errorMessage}</p>
      <Button onClick={retryAction} className="mt-4">Try Again</Button>
    </div>
  }
>
  {/* Your content */}
</Modal>
```

## With Footer Actions

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

## Different Sizes

```tsx
// Small modal
<Modal size="sm" isOpen={isOpen} onClose={handleClose}>
  {/* Content */}
</Modal>

// Medium modal
<Modal size="md" isOpen={isOpen} onClose={handleClose}>
  {/* Content */}
</Modal>

// Large modal
<Modal size="lg" isOpen={isOpen} onClose={handleClose}>
  {/* Content */}
</Modal>

// Extra large modal (default)
<Modal size="xl" isOpen={isOpen} onClose={handleClose}>
  {/* Content */}
</Modal>

// Full width modal
<Modal size="full" isOpen={isOpen} onClose={handleClose}>
  {/* Content */}
</Modal>
```

## Hide Header or Footer

```tsx
// No header
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  hideHeader={true}
>
  {/* Content */}
</Modal>

// No footer
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  hideFooter={true}
  footer={<div>This won't show</div>}
>
  {/* Content */}
</Modal>
```

## Custom Z-Index

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  customZIndex={1000000}
>
  {/* Content */}
</Modal>
```

## Prevent Closing on Overlay Click

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  closeOnOverlayClick={false}
>
  {/* Content */}
</Modal>
```

## Complete Example: Signed Consent Modal

```tsx
function SignedConsentsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<SignedConsent | null>(null);

  const handleView = async (consent: SignedConsent) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedConsent(null);

    try {
      const response = await apiClient.get(`/signed-consents/${consent.id}`);
      setSelectedConsent(response.data);
    } catch (error: any) {
      setDetailError(error?.message || 'Failed to load consent details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDetailError(null);
    setSelectedConsent(null);
  };

  return (
    <>
      {/* Your list/table */}
      
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Signed Consent Details"
        size="xl"
        loading={isDetailLoading}
        error={detailError}
        loadingSkeleton={
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        }
        footer={
          selectedConsent && !detailError && !isDetailLoading ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleDownload(selectedConsent)}>
                Download PDF
              </Button>
              <Button onClick={handleCloseModal}>
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedConsent && (
          <div>
            <h3>{selectedConsent.signer_name}</h3>
            <p>{selectedConsent.signer_email}</p>
            {/* More content */}
          </div>
        )}
      </Modal>
    </>
  );
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | **required** | Controls modal visibility |
| `onClose` | `() => void` | **required** | Called when modal should close |
| `title` | `ReactNode` | `undefined` | Modal title |
| `description` | `ReactNode` | `undefined` | Modal description (below title) |
| `children` | `ReactNode` | **required** | Modal content |
| `footer` | `ReactNode` | `undefined` | Modal footer content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'xl'` | Modal size |
| `maxWidthClassName` | `string` | `undefined` | Custom max-width class (overrides size) |
| `panelClassName` | `string` | `''` | Additional classes for modal panel |
| `showCloseButton` | `boolean` | `true` | Show X button in header |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking overlay |
| `loading` | `boolean` | `false` | Show loading skeleton |
| `loadingSkeleton` | `ReactNode` | Default skeleton | Custom loading skeleton |
| `error` | `string \| null` | `null` | Error message to display |
| `errorComponent` | `ReactNode` | Default error UI | Custom error component |
| `hideHeader` | `boolean` | `false` | Hide entire header |
| `hideFooter` | `boolean` | `false` | Hide footer even if provided |
| `customZIndex` | `number` | `999999` | Custom z-index value |

## Best Practices

1. **Always manage state properly**: Use separate state for `isOpen`, `loading`, `error`, and `data`
2. **Clean up on close**: Reset error and data states when modal closes
3. **Use custom skeletons**: Match skeleton structure to your actual content for better UX
4. **Handle errors gracefully**: Always provide user-friendly error messages
5. **Disable close during loading**: The modal automatically prevents overlay close during loading
6. **Use appropriate sizes**: Choose modal size based on content (don't use `full` for simple forms)
7. **Provide footer actions**: Always give users a way to close or act on modal content

## Common Patterns

### Confirmation Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Delete"
  size="sm"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </div>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>
```

### Form Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Add New Item"
  size="lg"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button onClick={handleSubmit}>Save</Button>
    </div>
  }
>
  <form>
    {/* Form fields */}
  </form>
</Modal>
```

### View Details Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Item Details"
  size="xl"
  loading={isLoading}
  error={error}
  footer={
    data && (
      <div className="flex justify-end">
        <Button onClick={handleClose}>Close</Button>
      </div>
    )
  }
>
  {data && (
    <div>
      {/* Display data */}
    </div>
  )}
</Modal>
```
