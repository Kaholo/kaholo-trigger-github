# kaholo-plugin-GithubTrigger
Simple webhook trigger for Kaholo

## How to use:
After installing the plugin on Kaholo,
on your GitHub repository, create a new webhook and set the following URL:
**{KAHOLO_URL}/github/webhook**

Whenever creating a new Trigger in Kaholo, you will need to specify the following:
* Repository URL: The repository which pushing to will start the execution (e.g https://github.com/Kaholo/kaholo-plugin-GithubTrigger.git) 
* Branch : The branch which pushing to will start the execution
* Secret : Same secret as you specify when setting up the webhook on GitHub

## Git Push:
This trigger whenever there is a push to a repository.

## Webhook URL:
**{KAHOLO_URL}/webhook/github/push**

### Parameters:
1) Secret - Github webhook secret key
2) Branch - the branch or branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any tag)specified, then all branches)
3) Repo URL - The repository URL (if not specified, then all repositories)

## Github Pull Request merge:
This trigger whenever there is merge of a pull request.

## Webhook URL:
**{KAHOLO_URL}/webhook/github/pr**

### Parameters:
1) Secret - Github webhook secret key
2) Target Branch - the target branch or target branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any any target branch)
3) Source Branch - the source branch or source branch [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any any source branch)
3) Repo URL - The repository URL (if not specified, then all repositories)


## Git Push tag:
This trigger whenever there is a push of a tag.

## Webhook URL:
**{KAHOLO_URL}/webhook/github/pt**

### Parameters:
1) Secret - Github webhook secret key
2) Repo name - The name of the repository (if not specified, then all repositories)
3) Tag - the tag or tag [minimatch pattern](https://github.com/isaacs/minimatch#readme) (if not specified, then any tag)
