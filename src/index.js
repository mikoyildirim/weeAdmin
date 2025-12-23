// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { App as AntApp } from "antd";
import App from "./App";
import { store } from "./redux/store.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <AntApp>
      <App />
    </AntApp>
  </Provider>
);
