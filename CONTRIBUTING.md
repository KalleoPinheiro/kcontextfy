# Contributing to KContextify

## Development Setup

1. Clone repo
2. `pnpm install`
3. `pnpm dev`

## Code Style

- TypeScript strict mode
- Biome for linting and formatting

## Commands

```bash
pnpm lint         # Check for issues
pnpm lint:fix     # Auto-fix issues
pnpm format       # Format code
pnpm test         # Run tests
pnpm build        # Production build
```

## Workflow

1. Fork repo
2. Create feature branch (`git checkout -b feature/my-feature`)
3. Make changes with tests
4. Run `pnpm lint:fix && pnpm format && pnpm test`
5. Push and create PR

## Testing

- Unit tests in `src/__tests__/`
- Test files: `*.test.ts`
- Run tests: `pnpm test`

## Extension Development

1. Run `pnpm build` to build to `dist/`
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select `dist/`
5. Extension loads in toolbar
6. After code changes: `pnpm build` then click **Update** on the extension card
