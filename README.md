# kaholo-trigger-github
Simple webhook trigger for Kaholo

## How to use:
After installing the plugin on Kaholo,
on your GitHub repository, create a new webhook and set the URL required by each method.

## Git Push:
This trigger whenever there is a push to a repository.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/push**

### Parameters:
1) Secret - Github webhook secret key.
2) Branch Pattern - the branch or branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then all branches are accepted)
3) Repo Name - The repository Name (if not specified, then all repositories are accepted)

## Github Pull Request merge:
This trigger whenever there is merge of a pull request.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/pr**

### Parameters:
1) Secret - Github webhook secret key
2) Target Branch - the target branch or target branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any target branch is accepted)
3) Source Branch - the source branch or source branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any source branch is accepted)
3) Repo Name - The repository Name (if not specified, then all repositories are accepted)


## Git Push tag:
This trigger whenever there is a push of a tag.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/pt**

### Parameters:
1) Secret - Github webhook secret key
2) Repo name - The name of the repository (if not specified, then all repositories are accepted)
3) Tag Pattern - the tag or tag [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any tag is accepted)
