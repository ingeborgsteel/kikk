import { Hono } from "hono";
import observationsApp from "./routes/observations";
import locationsApp from "./routes/locations";
import usersApp from "./routes/users";
import userAccessesApp from "./routes/userAccesses";

const dataApp = new Hono<{ Bindings: Env }>();

dataApp.route("/observations", observationsApp);
dataApp.route("/locations", locationsApp);
dataApp.route("/users", usersApp);
dataApp.route("/user-accesses", userAccessesApp);

export default dataApp;
