/// <reference types="@bytechef/workflow-api" />

interface Email {
    from: string;
    id: string;
    subject: string;
    threadId: string;
}

({
    name: "Sample Code Project TypeScript",
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
                    perform: (context) => {
                        const name = context.input("name") as string;

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
            triggers: [{name: "newEmail", type: "googleMail/v1/newEmailPolling", parameters: {format: "SIMPLE"}}],
            outputs: [{name: "summary", task: "summarize"}],
            tasks: [
                {
                    name: "summarize",
                    label: "Summarize",
                    perform: (context) => {
                        const email = context.input("newEmail") as Email;

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
                    connections: [{componentName: "googleMail", name: "gmail"}],
                    perform: (context) => {
                        const result: {messages?: Email[]} = context.component.googleMail.searchEmail(
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
            inputs: [
                {
                    name: "channel", label: "Slack Channel", type: "STRING", required: true,
                    componentName: "slack", componentVersion: 1, groupName: "channel"
                }
            ],
            triggers: [{name: "newEmail", type: "googleMail/v1/newEmailPolling", parameters: {format: "SIMPLE"}}],
            outputs: [{name: "message", task: "postToSlack"}],
            tasks: [
                {
                    name: "postToSlack",
                    label: "Post to Slack",
                    description: "Posts the sender and subject with the Slack Send Channel Message action.",
                    connections: [{componentName: "slack", name: "slack"}],
                    perform: (context) => {
                        const email = context.input("newEmail") as Email;

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
}) satisfies ByteChef.ProjectDefinition;
