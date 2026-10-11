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
        }
    ]
})
