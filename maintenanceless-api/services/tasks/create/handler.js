import handler from "../../../libs/aws/handlerLib";

export const main = handler(async (event, context) => {
  return {
    body: {
      result: "Task successfully created."
    }
  };
});
