import { Hono } from "hono";
import observationsApp from "./routes/observations";
import locationsApp from "./routes/locations";
import profilesApp from "./routes/profiles";
import userAccessesApp from "./routes/userAccesses";

const dataApp = new Hono<{ Bindings: Env }>();

dataApp.route("/observations", observationsApp);
dataApp.route("/locations", locationsApp);
dataApp.route("/profiles", profilesApp);
dataApp.route("/user-accesses", userAccessesApp);

export default dataApp;
