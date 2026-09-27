# Field notes from C-137

**Portal stable.** *Destination questionable.*

> Check the coordinates before stepping through.

- [x] Charge the portal gun
- [ ] Find a dimension with better coffee

Use `openPortal(home)` to return. [VS Code](https://code.visualstudio.com/)

```typescript
const coordinates = { dimension: "C-137", safe: true, population: 42 };
```

```json
{"portal": {"destination": {"coordinates": {"dimension": "C-137", "safe": true}}}}
```

```python
def open_portal(dimension: str = "C-137") -> str:
    # A comment should be readable, too.
    return f"Welcome to {dimension}: {42} possibilities"
```

```html
<button class="portal" aria-label="Open portal">Step through</button>
```

```css
.portal { color: #3e5a04; padding: 1rem; }
```
