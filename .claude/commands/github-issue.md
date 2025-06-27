# GitHub Issue Creator

Create a bug report issue on any GitHub repository, following the repository's contribution guidelines.

## Usage

To create a bug report issue, use the following prompt:

```
Create a GitHub issue for bug report in [repository] with the following details:
- Title: [issue title]
- Description: [bug description]
- Steps to reproduce: [steps]
- Expected behavior: [expected]
- Actual behavior: [actual]
- Environment: [OS, browser, versions]
- Labels: [bug, priority-high, etc.]
```

## Example

```
Create a GitHub issue for bug report in facebook/react with the following details:
- Title: useState hook not updating component when called in useEffect
- Description: When calling setState inside useEffect with an empty dependency array, the component doesn't re-render
- Steps to reproduce: 
  1. Create a component with useState
  2. Call setState inside useEffect with []
  3. Component doesn't update
- Expected behavior: Component should re-render with new state
- Actual behavior: Component remains with initial state
- Environment: macOS 14.0, Chrome 120, React 18.2.0
- Labels: bug, hooks
```

## Command Implementation

When this command is invoked, Claude will:

1. Validate the repository exists using `gh repo view`
2. **Check for issue templates and contribution guidelines:**
   - Look for `.github/ISSUE_TEMPLATE/bug_report.md` or similar templates
   - Read `CONTRIBUTING.md` for issue formatting rules
   - Read `README.md` for any issue reporting guidelines
   - Check `.github/CONTRIBUTING.md` if it exists
3. **Adapt the issue format based on repository guidelines:**
   - Use the repository's issue template if available
   - Follow any specific formatting rules found in documentation
   - Include required fields specified in the guidelines
4. Create the issue using `gh issue create` with appropriate labels
5. Return the created issue URL

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Repository must be accessible to the authenticated user

## Adaptive Template

The issue format will be automatically adapted based on the repository's guidelines. If no specific guidelines are found, the following default template will be used:

```markdown
## Bug Description
[Your description]

## Steps to Reproduce
[Your steps]

## Expected Behavior
[Expected behavior]

## Actual Behavior
[Actual behavior]

## Environment
- **OS**: [OS info]
- **Browser/Runtime**: [Browser info]
- **Package Version**: [Version info]

## Additional Context
[Any additional context]
```

## Implementation Notes

When executing this command, Claude will:
1. First fetch and analyze the repository's documentation
2. Extract any issue formatting requirements
3. Generate an issue that complies with the repository's standards
4. Show a preview before creating the issue