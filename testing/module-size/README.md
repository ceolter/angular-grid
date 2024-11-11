# AG Grid Module Size Validation

This project is used to validate that the AG Grid modules do not grow unexpectedly.

```
npm run test
```

This will run the validation steps which will produce a results file that list the self size of a module. This is calculated as the increase in bundle size that adding that module into the dummy app gives over just the core of AG Grid.
