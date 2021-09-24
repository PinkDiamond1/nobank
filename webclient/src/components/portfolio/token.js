import React, { useState, useEffect, useContext } from "react";
import { connect } from "redux-zero/react";

const web3utils = require("web3-utils");

import AccountProvider, {
  SmartVaultContext,
} from "../../context/SmartvaultContext";

import actions from "../../redux/actions";

import SimpleChart from "./simpleChart";

import ChartHeaderToken from "./chartHeaderToken";
import ChartBottom from "./chartBottom";
import Transactions from "./transactions";
import TokenCategory from "./tokenCategory";

import { useLazyQuery } from "@apollo/client";
import { get30DaysPrice } from "../../subgraph_query";
import moment from "moment";
import { useParams } from "react-router-dom";

import NewsSample1 from "../../../public/news_sample1.png";
import NewsSample2 from "../../../public/news_sample2.png";
import NewsSample3 from "../../../public/news_sample3.png";

const CHFUSD = 1.08;

const getPriceForUser = (orig_price) => {
  const priceByCurrency = Number(orig_price) / CHFUSD;
  const price = Math.round(priceByCurrency * 1000) / 1000;

  return price;
};

const Token = (props) => {
  const { smartvault } = useContext(SmartVaultContext);
  const { address } = useParams();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [balance, setBalance] = useState("");
  const [chainlinkPrice, setChainlinkPrice] = useState("");
  const [ONEPrice, setONEPrice] = useState("");

  let dayPriceData = [];
  let price;
  let priceChangePercent;
  let priceChange;
  let totalValue;
  const ONEAddress = "0x7466d7d0c21fa05f32f5a0fa27e12bdc06348ce2";

  // mapping testnet address to mainnet one temporarily
  const tokenAddressMap = new Map([
    [
      "0x268d6ff391b41b36a13b1693bd25f87fb4e4b392",
      "0x6983d1e6def3690c4d616b13597a09e6193ea013",
    ],
    [
      "0x0e80905676226159cc3ff62b1876c907c91f7395",
      "0xe176ebe47d621b984a73036b9da5d834411ef734",
    ],
    [
      "0x7466d7d0c21fa05f32f5a0fa27e12bdc06348ce2",
      "0xcf664087a5bb0237a0bad6742852ec6c8d69a27a",
    ],
    [
      "0x6c4387c4f570aa8cadcaffc5e73ecb3d0f8fc593",
      "0x3095c7557bcb296ccc6e363de01b760ba031f2d9",
    ],
  ]);

  useEffect(() => {
    async function fetchTokenData() {
      let tokenInfo = JSON.parse(localStorage.getItem(address));
      let addressForSushi;

      if (!tokenInfo) {
        tokenInfo = await smartvault.getTokenInfo(address);
        localStorage.setItem(tokenInfo.address, JSON.stringify(tokenInfo));
      }
      setName(tokenInfo.name);
      setSymbol(tokenInfo.symbol);
      setBalance(tokenInfo.balance);

      const chainP = await smartvault.harmonyClient.getTokenPriceByChainlink(
        address,
        props.environment
      );
      const chainPForUser = getPriceForUser(chainP);
      setChainlinkPrice(chainPForUser);

      const ONEPrice = await smartvault.harmonyClient.getTokenPriceByChainlink(
        ONEAddress,
        props.environment
      );
      setONEPrice(ONEPrice);

      if (tokenAddressMap.has(address) && props.environment != "mainnet") {
        addressForSushi = tokenAddressMap.get(address);
      } else {
        addressForSushi = address;
      }
      //setTokenAddress(address);

      getPrice({
        variables: {
          tokenAddress: addressForSushi,
        },
      });
    }

    fetchTokenData();
  }, []);

  const [getPrice, { loading, error, data }] = useLazyQuery(get30DaysPrice);

  //if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  if (data && data.token != null) {
    const latestPrice = data.token.derivedETH * ONEPrice;
    const latestPriceForUser = getPriceForUser(latestPrice);

    const yesterdayPrice = data.token.dayData[1].priceUSD;
    const priceChange24 =
      ((latestPrice - yesterdayPrice) / yesterdayPrice) * 100;

    price = latestPriceForUser;

    priceChange = getPriceForUser(latestPrice - yesterdayPrice);
    priceChangePercent = Math.round(priceChange24 * 1000) / 1000;

    totalValue = Math.round(latestPriceForUser * balance * 1000) / 1000;

    data.token.dayData.forEach((day) => {
      const priceForUser = getPriceForUser(day.priceUSD);

      const daydata = {
        time: moment.unix(day.date).format("YYYY-MM-DD"),
        value: priceForUser,
      };
      dayPriceData.unshift(daydata);
    });

    //props.setHoldingTokens({ address: tokenAddress, name: name, latestPrice: price, priceChange: priceChange });
  }

  // useEffect(() => {
  //   if (!props.holdingTokens.length) {
  //     setName("ETH");
  //     setLatestPrice("2943");
  //     setPriceChange("2.61");
  //   } else {
  //     const tokenInfo = props.holdingTokens.filter((token) => {
  //       return token.address == address;
  //     });

  //     console.log(tokenInfo);
  //     setName(tokenInfo[0].name);
  //     setLatestPrice(tokenInfo[0].latestPrice);
  //     setPriceChange(tokenInfo[0].priceChange);
  //   }
  // }, []);

  // const { loading, error, data } = useQuery(get30DaysPrice, {
  //   variables: {
  //     tokenAddress: address,
  //   },
  // });

  // if (loading) return "Loading...";
  // if (error) return `Error! ${error.message}`;

  // if (data) {
  //   data.token.dayData.forEach((day) => {
  //     const priceCHF = Number(day.priceUSD) * CHFUSD;
  //     const priceForUser = Math.round(priceCHF * 1000) / 1000;
  //     const daydata = { time: moment.unix(day.date).format("YYYY-MM-DD"), value: priceForUser };
  //     dayPriceData.unshift(daydata);
  //   });
  // }

  return (
    <div className="container-fluid">
      <section>
        <div className="row min-h-25">
          <div className="col-lg-4 border border-no-bank-grayscale-silver ">
            <Transactions />
          </div>

          <div className="col-lg-8 border border-no-bank-grayscale-silver justify-content-center">
            <div className="row p-4 pb-0">
              {price && (
                <ChartHeaderToken
                  tokenName={name}
                  currentPrice={price}
                  priceChange={priceChangePercent}
                />
              )}
            </div>

            <div className="row p-3">
              {dayPriceData.length == 30 && (
                <SimpleChart priceData={dayPriceData} />
              )}
            </div>

            <ChartBottom />
          </div>
        </div>
      </section>

      {/* token name header */}
      <section>
        <div className="d-flex align-items-center justify-content-between my-3 mx-2">
          <div className="d-flex align-items-center">
            <div className="fs-4 me-2 text-no-bank-grayscale-iron fw-bold">
              {name}
            </div>
            {/* temporary */}
            {address == "0x0e80905676226159cc3ff62b1876c907c91f7395" ? (
              <TokenCategory category={"stablecoin"} />
            ) : (
              <TokenCategory category={"token"} />
            )}
          </div>
          <button
            type="button"
            className="btn rounded-pill btn-no-bank-highlight text-rb-bank-primary px-5 py-2"
          >
            Trade
          </button>
        </div>
      </section>

      {/* My position */}
      <section>
        <div className="row bg-no-bank-grayscale-platin mx-2">
          <div className="col-md-4 border border-no-bank-grayscale-silver p-4">
            <div>
              <div className="fs-4 text-no-bank-grayscale-iron">
                Current Price
              </div>
              <div className="d-flex flex-wrap align-items-baseline my-2 text-no-bank-primary">
                <span className="fs-1">{price && price.toLocaleString()}</span>
                <span className="fs-5 ms-1">CHF</span>
                <span className="font-sm text-no-bank-grayscale-iron ms-2">
                  (SushSwap)
                </span>
              </div>
              <div className="text-no-bank-grayscale-iron mb-2">
                <span className="">
                  {chainlinkPrice && chainlinkPrice.toLocaleString()}
                </span>
                <span className="ms-1">CHF</span>
                <span className="font-sm text-no-bank-grayscale-iron ms-2">
                  (Chainlink)
                </span>
              </div>
              <div>
                <span className="fs-5 text-danger">
                  {priceChange && priceChange.toLocaleString()} CHF
                </span>
                <i className="bi bi-caret-down-fill text-danger p-1" />
                <span className="text-no-bank-grayscale-iron ms-2">daily</span>
              </div>
              <div>
                <span className="fs-5 text-danger">{priceChangePercent} %</span>
                <i className="bi bi-caret-down-fill text-danger p-1" />
                <span className="text-no-bank-grayscale-iron ms-2">daily</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 border border-no-bank-grayscale-silver p-4">
            <div>
              <div className="fs-5 text-no-bank-grayscale-iron">
                My Position
              </div>
              <div className="my-2 text-no-bank-primary">
                <span className="fs-1">
                  {totalValue && totalValue.toLocaleString()}
                </span>
                <span className="fs-5 ms-1">CHF</span>
              </div>
              <div>
                <span className="fs-5 text-no-bank-grayscale-iron">Amount</span>

                <span className="ms-2 text-no-bank-primary">{balance}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 border border-no-bank-grayscale-silver p-4">
            <div>
              <div className="fs-5 text-no-bank-grayscale-iron">P&L</div>
              <div className="my-2">
                <span className="fs-1 text-danger">-369.70</span>
                <span className="fs-5 text-danger ms-1">CHF</span>
                <span className="text-no-bank-grayscale-iron ms-2">daily</span>
              </div>
              <div>
                <span className="fs-5 text-no-bank-grayscale-iron">
                  Unrealised
                </span>
                <span className="fs-5 text-success ms-2">7'260 CHF</span>
                <span className="text-no-bank-grayscale-iron ms-3">total</span>
              </div>
              <div>
                <span className="fs-5 text-success ms-1">+ 12.6%</span>
                <i className="bi bi-caret-up-fill text-success p-1" />
                <span className="text-no-bank-grayscale-iron ms-3">total</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description, Position Detail */}
      <section>
        <div className="row mx-2">
          <div className="col-md-6 border border-no-bank-grayscale-silver p-4">
            <div className="fs-4 text-no-bank-grayscale-iron mb-3">
              Description
            </div>
            <p className="text-no-bank-primary">
              World-renowned precious metals storage and custody service
              provider Swiss Vault have launched noGold (ticker: NGLD), a
              gold-backed stablecoin fully backed by physical gold held securely
              in SwissVault's save mountain storage. It combines the safe-haven
              benefits of owning physical gold with the flexibility,
              transparency, affordability, and security of a digital asset.
            </p>
          </div>
          <div className="col-md-6 border border-no-bank-grayscale-silver p-4">
            <div className="fs-4 text-no-bank-grayscale-iron">
              Position Detail
            </div>
            <div className="my-3">
              <div>
                <span className="text-no-bank-grayscale-iron">Market Cap</span>
                <span className="text-no-bank-primary ms-2">3.2 bn CHF</span>
              </div>
              <div className="mt-1">
                <span className="text-no-bank-grayscale-iron">
                  Trading Volume (24h)
                </span>
                <span className="text-no-bank-primary ms-2">68 mn CHF</span>
              </div>
              <div className="mt-1">
                <span className="text-no-bank-grayscale-iron">
                  Circuling Supply
                </span>
                <span className="text-no-bank-primary ms-2">1.8 mn</span>
              </div>
              <div className="mt-1">
                <span className="text-no-bank-grayscale-iron">
                  Available since
                </span>
                <span className="text-no-bank-primary ms-2">July 2020</span>
              </div>
              <div className="mt-1">
                <span className="text-no-bank-grayscale-iron">Issuer</span>
                <span className="text-no-bank-primary ms-2">
                  Swiss Vault Inc.
                </span>
              </div>
            </div>
            <div className="d-flex mt-4">
              <button
                type="button"
                className="btn border border-no-bank-primary rounded-pill text-rb-bank-primary p-2 px-3"
              >
                <i className="bi bi-arrow-up-right"></i>
                <span className="ms-1">Website</span>
              </button>
              <button
                type="button"
                className="btn border border-no-bank-primary rounded-pill text-rb-bank-primary p-2 px-3 ms-3"
              >
                <i className="bi bi-arrow-up-right"></i>
                <span className="ms-1">Whitepaper</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section>
        <div className="border border-no-bank-grayscale-silver p-4  mx-2 mb-5">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="fs-4 text-no-bank-grayscale-iron">News</div>
            <i className="bi bi-arrow-up-right fs-5"></i>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div>
                <img src={NewsSample1} className="img-fluid h-100" alt="" />
              </div>
              <div className="mt-2 text-no-bank-primary">August 16, 2021</div>
              <div className="mt-1 fs-3 text-no-bank-primary lh-sm">
                noGold just launched by nobank
              </div>
              <div className="mt-1 text-no-bank-grayscale-iron">
                r-bank.news
              </div>
            </div>
            <div className="col-md-4">
              <div>
                <img src={NewsSample2} className="img-fluid h-100" alt="" />
              </div>
              <div className="mt-2 text-no-bank-primary">August 16, 2021</div>
              <div className="mt-1 fs-3 text-no-bank-primary lh-sm">
                noGold – Is it the Next Big Thing?
              </div>
              <div className="mt-1 text-no-bank-grayscale-iron">
                barrons.com
              </div>
            </div>
            <div className="col-md-4">
              <div>
                <img src={NewsSample3} className="img-fluid h-100" alt="" />
              </div>
              <div className="mt-2 text-no-bank-primary">August 16, 2021</div>
              <div className="mt-1 fs-3 text-no-bank-primary lh-sm">
                How Investing in stablecoins like noGold helps you optimize your
                portfolio.
              </div>
              <div className="mt-1 text-no-bank-grayscale-iron">
                washingtonpost.com
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function TokenWithProvider() {
  return (
    <AccountProvider loadAccount={true}>
      <Token />
    </AccountProvider>
  );
}

const mapToProps = ({ setLocation, environment }) => ({
  setLocation,
  environment,
});
export default connect(mapToProps, actions)(TokenWithProvider);