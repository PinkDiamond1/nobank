import React, { Component } from "react";
var ReactDOM = require("react-dom");

import { HashRouter as Router, Switch, Route, Redirect } from "react-router-dom";

import "./custom.scss";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Provider, connect } from "redux-zero/react";
import { getLocalWallet } from "./config";

import store from "./redux/store";
import Header from "./components/header";
import Create from "./components/create";
import Wallet from "./components/wallet";
import Recover from "./components/recover";
import Landing from "./components/landing";
import Onboard from "./components/onboarding/onboard";
import portfolio from "./components/portfolio";

import AccountProvider from "./components/smartvault_provider";
import Portfolio from "./components/portfolio/index";
import Token from "./components/portfolio/token";
import Account from "./components/portfolio/account";
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from "@apollo/client";

Number.prototype.toFixedNoRounding = function (n) {
  const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g");
  const a = this.toString().match(reg)[0];
  const dot = a.indexOf(".");
  if (dot === -1) {
    // integer, insert decimal dot and pad up zeros
    return a + "." + "0".repeat(n);
  }
  const b = n - (a.length - dot) + 1;
  return b > 0 ? a + "0".repeat(b) : a;
};

const sushiGraphClient = new ApolloClient({
  uri: "https://sushi.graph.t.hmny.io/subgraphs/name/sushiswap/harmony-exchange",
  cache: new InMemoryCache(),
});

const mapToProps = ({ environment }) => ({ environment });
const App = connect(mapToProps)(({ environment }) => (
  <Router>
    <AccountProvider>
      <ApolloProvider client={sushiGraphClient}>
        <div className="container-fluid bg-white p-0">
          <Header />
          <Switch>
            <Route exact path="/">
              {getLocalWallet(environment, false) ? <Redirect to="/portfolio" /> : <Redirect to="/landing" />}
            </Route>
            <Route path="/landing">
              <Landing />
            </Route>
            <Route path="/create">
              <Create />
            </Route>
            <Route path="/onboard">
              <Onboard />
            </Route>
            <Route path="/wallet">
              <Wallet />
            </Route>
            <Route path="/recover">
              <Recover />
            </Route>
            <Route path="/portfolio">
              <Portfolio />
            </Route>
            <Route path="/account">
              <Account />
            </Route>
            <Route path="/token/:address">
              <Token />
            </Route>
          </Switch>
        </div>
      </ApolloProvider>
    </AccountProvider>
  </Router>
));

class MainScreen extends Component {
  render() {
    return (
      <Provider store={store}>
        <App />
      </Provider>
    );
  }
}

ReactDOM.render(<MainScreen />, document.getElementById("container"));
