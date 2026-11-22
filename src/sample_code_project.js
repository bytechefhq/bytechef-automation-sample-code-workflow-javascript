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
                    perform: function (input, context) {
                        const name = input.name;

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
                    perform: function (input, context) {
                        const email = input.newEmail;

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
                    perform: function (input, context) {
                        const result = context.component.googleMail.searchEmail(
                            {from: input.from, maxResults: 10}, "gmail");

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
                    perform: function (input, context) {
                        const email = input.newEmail;

                        const text = "New email from " + email.from + ": " + email.subject;

                        const message = context.component.slack.sendChannelMessage(
                            {channel: input.channel, text: text}, "slack");

                        context.log("info", "Posted to Slack: " + text);

                        return message;
                    }
                }
            ]
        },
        {
            name: "listOrders",
            label: "List Orders",
            description: "Serves an API Platform endpoint that answers with the orders fetchOrders returns.",
            triggers: [{name: "request", type: "apiPlatform/v1/newApiRequest", parameters: {request: {}}}],
            tasks: [
                {
                    name: "fetchOrders",
                    label: "Fetch Orders",
                    perform: function (input, context) {
                        const orders = [{id: 1, total: 42}, {id: 2, total: 17}];

                        context.log("info", "Returning " + orders.length + " orders");

                        return {orders: orders, count: orders.length};
                    }
                },
                {
                    name: "respond",
                    label: "Respond",
                    description: "Answers the API caller with the fetchOrders output.",
                    type: "apiPlatform/v1/responseToAPIRequest",
                    parameters: {responseType: "SUCCESS", response: {success: "${fetchOrders}"}}
                }
            ]
        }
    ]
})
