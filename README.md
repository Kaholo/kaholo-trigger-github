# Kaholo GitHub Webhook Trigger
Kaholo Triggers differ from ordinary Kaholo plugins in that they do nothing but listen and wait until some other event triggers them. Once triggered they begin the execution of a Kaholo pipeline.

This plugin adds a Trigger to Kaholo for [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks). Webhooks allow you to set up integrations that subscribe to certain events on GitHub.com. When one of those events is triggered, GitHub sends a HTTP POST payload to the webhook's configured URL. For example, if somebody does a `git push` to the main repository, you might want to start a Kaholo pipeline to rebuild, test, and/or deploy the new code. Using GitHub Webhooks and this Kaholo Trigger plugin, that is easy to automate using Kaholo.

## Prerequisites
Apart from installing this plugin in your Kaholo Server, you will also need a GitHub account with sufficient access to your repositories to set up a [GitHub Webhook](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks). If your Kaholo server is not exposed to the internet, you will also require sufficent network connectivity so GitHub can send an ***inbound HTTP POST*** to your Kaholo server. Otherwise in GitHub under "Recent Deliveries" you will see an error such as "We couldn’t deliver this payload: failed to connect to host".

If your Kaholo server is not directly accessible from the internet, for example a local development or test system, or one self-hosted within a restrictive firewall, you may require some kind network trickery to use this plugin. For example [ngrok](https://ngrok.com/). For a long-term solution it is recommended to work with your network administrator to get proper firewall/tunnel/forwarding rules in place to properly secure the connection.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## How to use:
Plugins are activated on a pipeline-by-pipeline basis in the Design page of the pipeline. Triggers are found there alongside Actions. Create a new trigger and give it a name, optional description and configuration, and select GitHub Trigger from drop-down list of plugins.

There are two supported methods - GitHub Push and GitHub Pull Request. Push should be used for a pipeline you wish to run every time code is pushed to a repo, and Pull Request is for pipelines that run only whenever there is a new Pull Request. More details on these configuration can be found below.

Either method includes both a Webhook (Payload URL) and a Secret (string in Kaholo Vault). For example `https://myusername.kaholo.net/webhook/github/push` and `mysecretstring`. These two are required for the GitHub WebHook end of the configuration. Both `json` and `x-www-form-urlencoded` application types are supported, as well as SSL verification. For more details please see the [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks) documentation.

Once configured, actions in GitHub triggering the webhook will result in a "Recent Delivery" in GitHub. If the delivery was successful, the event will get a green checkmark representing HTTP 200 (Success). On the Kaholo side, if the webhook matches the Kaholo trigger configuration, the Kaholo pipeline will be started. The Executions panel in Execution Results will also show it was triggered by "Trigger: Github myrepo main branch Pu...", and not for example "Started manually by user Soe Andso."

## Git Push:
This trigger expects an HTTP POST whenever there is a push to a repository. This can mean either a branch push or a tag push.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/push**

### Parameters:
1. Secret(string) - GitHub webhook secret, stored in Kaholo Vault.
2. Repository Name(string) - The name of the repository to watch for push events. If not specified, then pushes to any repository will trigger the Kaholo pipeline.
3. Branch Pattern(string) - The branch or branch [micromatch pattern](https://github.com/micromatch/micromatch#extended-globbing) to filter. **If not specified branch pushes won't trigger the pipeline**.
4. Tag Pattern(string) - The tag or tag [micromatch pattern](https://github.com/micromatch/micromatch#extended-globbing) to filter. **If not specified tag pushes won't trigger the pipeline**.

* Notice! If both tag and branch patterns are provided then this method will trigger on tag or branch pushes matching either pattern.
* You can enter **\*** as the branch\tag pattern to accept all branch\tag pushes.

## GitHub Pull Request merge:
This trigger expects an HTTP POST whenever there is an action performed on a pull request in GitHub.

### Webhook URL:
**{KAHOLO_URL}/webhook/github/pr**

### Parameters:
1. Secret(string) - GitHub webhook secret, stored in Kaholo Vault.
2. Repository Name(string) - The name of the repository to watch for pull request events. If not specified, then pull request actions in any repository will trigger the Kaholo pipeline.
3. Target Branch(string) - The target branch or target branch [micromatch pattern](https://github.com/micromatch/micromatch#extended-globbing) (if not specified, then any target branch is accepted)
4. Source Branch(string) - The source branch or source branch [micromatch pattern](https://github.com/micromatch/micromatch#extended-globbing) (if not specified, then any source branch is accepted)
5. Trigger on action(options) - The action that will cause it to trigger. if not specified then any. options are: 
    - Any (any action at all)
    - Opened
    - Merged
    - Declined
    - Reopened
    - Assigned
    - Review Requested
    - Review Request Removed
    - Labeled
    - Unlabeled
    - Synchronize