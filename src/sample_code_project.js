({
    name: "Sample Code Project JavaScript",
    version: "1",
    description: "Sample code project description.",
    workflows: [
        {
            name: "sampleWorkflow1",
            label: "Sample workflow 1",
            description: "Greets the name it is given.",
            inputs: [{name: "name", label: "Name", type: "STRING", required: true}],
            outputs: [{name: "greeting", task: "greet"}],
            tasks: [
                {
                    name: "greet",
                    label: "Greet",
                    description: "Builds a greeting from the name input.",
                    perform: function (context) {
                        const name = context.input("name");

                        context.log("info", "Greeting " + name);

                        return "Hello, " + name + "!";
                    }
                }
            ]
        },
        {
            name: "summarizeNewEmail",
            label: "Summarize New Email",
            description: "Runs for every new email in the inbox and logs who sent it.",
            // The trigger runs on the Gmail connection chosen for it when the project is deployed.
            triggers: [{name: "newEmail", type: "googleMail/v1/newEmailPolling", parameters: {format: "SIMPLE"}}],
            outputs: [{name: "summary", task: "summarize"}],
            tasks: [
                {
                    name: "summarize",
                    label: "Summarize",
                    perform: function (context) {
                        const email = context.input("newEmail");

                        const summary = "New email from " + email.from + ": " + email.subject;

                        context.log("info", summary);

                        return summary;
                    }
                }
            ]
        },
        {
            name: "fetchRecentEmails",
            label: "Fetch Recent Emails",
            description: "Returns the most recent emails, optionally only those from one sender.",
            inputs: [{name: "from", label: "From", type: "STRING", required: false}],
            outputs: [{name: "emails", task: "fetchEmails"}],
            tasks: [
                {
                    name: "fetchEmails",
                    label: "Fetch Emails",
                    // A code task's perform calls actions itself, so it declares the connections it uses; the name is
                    // what perform passes to the action. Pick the Gmail connection for "gmail" in the test
                    // configuration or when deploying the project.
                    connections: [{componentName: "googleMail", name: "gmail"}],
                    perform: function (context) {
                        const result = context.component.googleMail.searchEmail(
                            {from: context.input()["from"], maxResults: 10}, "gmail");

                        context.log("info", "Found " + (result.messages || []).length + " emails");

                        return result.messages || [];
                    }
                }
            ]
        },
        {
            name: "notifySlackOnNewEmail",
            label: "Notify Slack on New Email",
            description: "Posts every new email in the inbox to a Slack channel.",
            inputs: [{name: "channel", label: "Slack Channel ID", type: "STRING", required: true}],
            triggers: [{name: "newEmail", type: "googleMail/v1/newEmailPolling", parameters: {format: "SIMPLE"}}],
            outputs: [{name: "message", task: "postToSlack"}],
            tasks: [
                {
                    name: "postToSlack",
                    label: "Post to Slack",
                    description: "Posts the sender and subject with the Slack Send Channel Message action.",
                    // The Gmail trigger needs no declaration, but the task calls Slack itself, so it declares
                    // that connection and passes the name. Pick the Slack connection for "slack" in the test
                    // configuration or when deploying the project.
                    connections: [{componentName: "slack", name: "slack"}],
                    perform: function (context) {
                        const email = context.input("newEmail");

                        const text = "New email from " + email.from + ": " + email.subject;

                        const message = context.component.slack.sendChannelMessage(
                            {channel: context.input("channel"), text: text}, "slack");

                        context.log("info", "Posted to Slack: " + text);

                        return message;
                    }
                }
            ]
        }
    ]
})
