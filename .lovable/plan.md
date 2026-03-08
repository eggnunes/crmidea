

## Plan: Fix Client Auth Default Tab + Scroll Jump on Step Completion

### Issue 1: Login page defaults to "Cadastrar" (signup) instead of "Entrar" (login)

**Root cause:** In `src/pages/ClientAuthPage.tsx`, line 46:
```typescript
const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
```
The default state is `"signup"`.

**Fix:** Change the default to `"login"`. Also reorder the tabs so "Entrar" appears first (currently "Cadastrar" is the first tab).

**Files:** `src/pages/ClientAuthPage.tsx`

---

### Issue 2: Scroll jumps to bottom when completing a step

**Root cause:** In `src/components/consulting/ImplementationStepsManager.tsx`, the steps are rendered inside a `<ScrollArea>` with an `<Accordion>`. When `toggleEtapaConcluida` updates state (line 308: `setEtapas(updatedEtapas)`), the accordion item collapses (completed step) and the list re-sorts (line 329-332 sorts incomplete first, completed last). This re-ordering causes the scroll position to jump.

**Fix:** After completing a step, scroll the next incomplete step into view. Use a `useRef` on the `ScrollArea` and after the state update + toast, find the next incomplete step's accordion item and call `scrollIntoView({ behavior: 'smooth', block: 'start' })`. Alternatively, assign `ref`s or `data-step-id` attributes to each accordion item and scroll to the next one after completion.

**Files:** `src/components/consulting/ImplementationStepsManager.tsx`

---

### Summary of Changes

1. **`src/pages/ClientAuthPage.tsx`**
   - Change default `activeTab` from `"signup"` to `"login"`
   - Swap tab order so "Entrar" is the first tab

2. **`src/components/consulting/ImplementationStepsManager.tsx`**
   - After `toggleEtapaConcluida` completes and state updates, use `setTimeout` to scroll the next incomplete step into view using `data-step-id` attributes on accordion items

