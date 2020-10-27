test("test that the handler throws 500 error if there is an uncaught exception", async () => {
  const testFunction = (event, context) => new Error("TEST ERROR");
});
