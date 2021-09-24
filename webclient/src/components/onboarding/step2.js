import React, { useEffect, useState } from "react";
import { connect } from "redux-zero/react";

import actions from "../../redux/actions";
import { getAuth, isEmailVerified } from "firebase/auth";

const Step2 = ({ user, setOnboardingStep }) => {
  const [emailValidated, setEmailValidated] = useState(false);
  const { userEmail } = user;
  const auth = getAuth();

  useEffect(() => {
    const checkEmailValidity = () => {
      auth.currentUser.reload();
      auth.currentUser.emailVerified && setEmailValidated(true);
    };

    setInterval(checkEmailValidity, 1000);
  }, []);

  const handleEmail = () => {
    console.log("handling email");
  };

  const handleClick = (evt) => {
    const { id } = evt.target;
    if (id == "backButton") {
      setOnboardingStep(1);
    } else if (id == "continueButton") {
      setOnboardingStep(3);
    } else {
    }
  };

  return (
    <div className="bg-white align-content-center border-top border-no-bank-grayscale-titanium justify-content-start pt-5 pe-5 ps-4 h-100">
      <div className="d-flex flex-column mb-5 ps-2 pt-3 pe-3">
        <div>
          <div className="fs-6 text-no-bank-grayscale-iron text-uppercase">
            step 2
          </div>

          <div className="fs-1 text-no-bank-primary">Verify email address</div>
          <div className="pt-5">
            {emailValidated && <div>Thank you for validating your email</div>}
            {!emailValidated && (
              <div>
                <div className=" mb-4">
                  Please verify your email using the link we just sent you at{" "}
                  <span className="fw-bold">{userEmail}</span>
                </div>

                <div className="spinner-grow" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="mt-5">
                  <span className="text-no-bank-grayscale-iron">
                    Didn’t receive an email?{" "}
                    <span
                      className="fw-bold text-no-bank-primary"
                      onClick={handleEmail}
                    >
                      Resend
                    </span>
                  </span>
                </p>
              </div>
            )}
            <div className="d-flex justify-content-end pe-5 pb-3 fixed-bottom">
              <div className="pe-3 pb-3">
                <button
                  id="backButton"
                  type="button"
                  onClick={handleClick}
                  //className="btn btn-no-bank-grayscale-silver text-white rounded-pill"
                  className="btn rounded-pill btn-no-bank-white text-rb-bank-primary pe-4 me-1"
                >
                  Back
                </button>
                <button
                  id="continueButton"
                  type="button"
                  onClick={handleClick}
                  //className="btn btn-no-bank-grayscale-silver text-white rounded-pill"
                  className={`btn rounded-pill ${
                    emailValidated
                      ? "btn-no-bank-highlight text-rb-bank-primary"
                      : "btn-no-bank-grayscale-silver text-white"
                  }`}
                  disabled={!emailValidated && "disabled"}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapToProps = ({ user }) => ({ user });
export default connect(mapToProps, actions)(Step2);