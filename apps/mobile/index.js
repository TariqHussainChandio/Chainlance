import "./src/lib/core-setup";
import { hydrateKvStorage } from "./src/lib/core-setup";
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

void hydrateKvStorage();

AppRegistry.registerComponent(appName, () => App);
