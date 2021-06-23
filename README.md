# kaholo-trigger-github
Simple webhook trigger for Kaholo

## How to use:
After installing the plugin on Kaholo,
on your GitHub repository, create a new webhook and set the URL required by each method.
Make sure to check "application/json" in Content type.

## Git Push:
This trigger whenever there is a push to a repository. This can mean either a branch push or a tag push.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/push**

### Parameters:
1. Secret(string) - Github webhook secret key.
2. Repo Name(string) - The repository Name (if not specified, then all repositories are accepted)
3. Branch Pattern(string) - The branch or branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) to filter. **If not specified branch push won't trigger**
4. Tag Pattern(string) - The tag or tag [minimatch pattern](https://github.com/isaacs/minimatch#readme) to filter. **If not specified tag push won't trigger**

* Notice! If both tag and branch patterns are provided then this method will trigger on both tag and branch pushes.
* You can enter **\*** as the branch\tag pattern to accept all branch\tag pushes.

## Github Pull Request merge:
This trigger whenever there is an action performed on a pull request.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/pr**

### Parameters:
1. Secret(string) - Github webhook secret key
2. Repo Name(string) - The repository Name (if not specified, then all repositories are accepted)
3. Target Branch(string) - The target branch or target branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any target branch is accepted)
4. Source Branch(string) - The source branch or source branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any source branch is accepted)
5. Trigger on action(options) - The action that will cause it to trigger. if not specified then any. options are: 
    - Any(any action sent by github, not only Opened/Merged/Declined)
    - Opened
    - Merged
    - Declined