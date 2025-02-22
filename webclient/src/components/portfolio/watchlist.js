import React, { useState, useEffect, useContext } from "react";
import { SmartVaultContext, SmartVaultConsumer } from "../../context/SmartvaultContext";
import { connect } from "redux-zero/react";
import actions from "../../redux/actions";
import { useHistory, useRouteMatch } from "react-router-dom";

import TokenCategory from "./tokenCategory";

const Watchlist = (props) => {
  const history = useHistory();
  const { url } = useRouteMatch();

  const handleRowClick = (address) => {
    history.push(`/token/${address}`);
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between">
        <div className="fs-4 text-no-bank-grayscale-iron">Your Watchlist</div>

        <i className="bi bi-arrow-up-right fs-5"></i>
      </div>

      <div className="overflow-auto" style={{ height: 172 }}>
        <table className="table">
          <thead>
            <tr className="fw-normal font-sm text-no-bank-grayscale-iron">
              <th scope="col"></th>
              <th scope="col" className="fw-normal">
                Last
              </th>
              <th scope="col" className="fw-normal">
                24h Change
              </th>
              <th scope="col" className="fw-normal">
                Total volume
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="pointer" onClick={() => handleRowClick("0x268d6ff391b41b36a13b1693bd25f87fb4e4b392")}>
              <td>
                <div className="d-flex  align-items-center">
                  <span className="me-3">1ETH</span>
                  <TokenCategory category={"token"} />
                  <i className="bi bi-star-fill ms-3"></i>
                </div>
              </td>
              <td>
                <span className="text-no-bank-primary">0.22</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
              <td>
                <span className="text-danger">-3.24%</span>
              </td>
              <td>
                <span className="text-no-bank-primary">1.2</span>
                <span className="ms-1 text-no-bank-grayscale-iron">bn</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
            </tr>
            <tr className="pointer" onClick={() => handleRowClick("0x6c4387c4f570aa8cadcaffc5e73ecb3d0f8fc593")}>
              <td>
                <div className="d-flex  align-items-center">
                  <span className="me-3">1WBTC</span>
                  <TokenCategory category={"coin"} />
                  <i className="bi bi-star-fill ms-3"></i>
                </div>
              </td>
              <td>
                <span className="text-no-bank-primary">41353</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
              <td>
                <span className="text-danger">-1.24%</span>
              </td>
              <td>
                <span className="text-no-bank-primary">1.2</span>
                <span className="ms-1 text-no-bank-grayscale-iron">bn</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
            </tr>
            <tr>
              <td>
                <div className="d-flex  align-items-center">
                  <span className="me-3">DOGE</span>
                  <TokenCategory category={"coin"} />
                  <i className="bi bi-star-fill ms-3"></i>
                </div>
              </td>
              <td>
                <span className="text-no-bank-primary">0.22</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
              <td>
                <span className="text-danger">-3.24%</span>
              </td>
              <td>
                <span className="text-no-bank-primary">1.2</span>
                <span className="ms-1 text-no-bank-grayscale-iron">bn</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
            </tr>
            <tr>
              <td>
                <div className="d-flex  align-items-center">
                  <span className="me-3">USDT</span>
                  <TokenCategory category={"stablecoin"} />
                  <i className="bi bi-star-fill ms-3"></i>
                </div>
              </td>
              <td>
                <span className="text-no-bank-primary">1.002</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
              <td>
                <span className="text-danger">-0.001%</span>
              </td>
              <td>
                {" "}
                <span className="text-no-bank-primary">7.9</span>
                <span className="ms-1 text-no-bank-grayscale-iron">bn</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
            </tr>

            <tr>
              <td>
                <div className="d-flex  align-items-center">
                  <span className="me-3">BTC</span>
                  <TokenCategory category={"coin"} />
                  <i className="bi bi-star-fill ms-3"></i>
                </div>
              </td>
              <td>
                <span className="text-no-bank-primary">42434</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
              <td>
                <span className="text-success">5.32%</span>
              </td>
              <td>
                {" "}
                <span className="text-no-bank-primary">12.9</span>
                <span className="ms-1 text-no-bank-grayscale-iron">bn</span>
                <span className="ms-1 text-no-bank-grayscale-iron">CHF</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

const mapToProps = ({}) => ({});
export default connect(mapToProps, actions)(Watchlist);
