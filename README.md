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

## Git push to tag:
This trigger whenever there is a push of a tag.

### Parameters:
1) Secret - Github secret key
2) Repo name - such as kaholo-trigger-github
3) Tag pattern - such as v1* to include v1.0, v1.1 ...
