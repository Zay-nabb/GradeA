import React, { useState } from "react";
import { supabase } from "../../supabase.js";
import { useNavigate } from "react-router-dom";
import {FaExclamationCircle} from "react-icons/fa";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

import CredentialsForm from "./components/CredentialsForm.jsx";
import ForgotPasswordForm from "./components/ForgotPassword.jsx";
import { validateEmail } from '../../utils/FormValidateInfo.jsx';

const Login = () => {
  const [formErrors, setFormErrors] = useState({});
  const [email, setEmail] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [componentIndex, setComponentIndex] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          email: 'Invalid login credentials.',
          password: 'Invalid login credentials.',
        }));
      }
      else {
      toast.error(error.message); }
      return;
    }

    if (data?.user) {
      const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("is_approved")
          .eq("id", data.user.id)
          .single();

      if (profileError || !userProfile.is_approved) {
        toast.info("Your account is pending admin approval. Please wait for approval.");
        await supabase.auth.signOut();
        return;
      }

      if (!userProfile) {
        console.log("Non-existent account!");
        return;
      }

      alert("Login successful!");
      navigate("/dashboard"); // Redirect to the dashboard or home page
    }
  };

  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.log(error.message)
      if (error.message.includes("invalid format")) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          forgotPasswordEmail: 'This email address can not be found.',
        }));
      }
    } else {
      toast.info("Password reset email sent! Check your inbox.");
    }
  };

  const components = [ //I will rework all of this and turn them into components proper, at some point in time. <3
    {title: 'Enter Credentials', content: (<CredentialsForm
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      setComponentIndex={setComponentIndex}
      setForgotPasswordEmail={setForgotPasswordEmail}
      formErrors = {formErrors}
      setFormErrors={setFormErrors}/>)
    },
    {title: 'Recover Your Password', content: (<ForgotPasswordForm
      forgotPasswordEmail={forgotPasswordEmail}
      setForgotPasswordEmail={setForgotPasswordEmail}
      formErrors={formErrors}
      setFormErrors={setFormErrors}/>),
      height: "20vh"
    },
  ];

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
        <div>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 text-center">{components[componentIndex].title}</h2>
          <div
              className="min-w-0 flex transition-transform duration-300 ease-in-out gap-x-20 z-10"
              style={{
                transform: `translateX(-${componentIndex * 120}%)`,
                width: '100%',
              }}
          >
            {components.map((componentContent, index) => (
                <div key={index}
                     className="flex-shrink-0 w-full justify-center z-10 overflow-hidden" // Style of the most inner part, which is basically the contents of the steps. space-x-4 mb-4
                     style={{justifyContent: 'center',
                       minHeight: 'auto',
                       maxHeight: components[componentIndex].height}}>
                  {componentContent.content}
                </div>
            ))}
          </div>
          {componentIndex === 0 && (
              <div className="flex gap-5">

                <button
                    type="button"
                    onClick={async (e) => {
                      if (validateEmail(email)) {
                          await handleLogin(e); // Wait for the Promise to resolve
                      } else {
                        console.log("failed");
                        setFormErrors((prevErrors) => ({
                          ...prevErrors,
                          email: 'Invalid email address.',
                        }));
                        console.log(formErrors)
                      }
                    }}
                    disabled={!((email) && (password)) || formErrors.email} // Object.keys(formErrors).length === 0
                    className={`w-full py-2 rounded mt-4 ${(email) && (password) && !formErrors.email ? 'bg-black hover:bg-gray-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  Login
                </button>

              </div>
          )}
          {componentIndex === components.length - 1 && (
              <div className="flex gap-5 z-20">
                <button
                    type="button"
                    onClick={() => {
                      setComponentIndex(prevComponentIndex => prevComponentIndex - 1);
                    delete formErrors.email;
                    delete formErrors.password;
                    delete formErrors.forgotPasswordEmail;
                    setForgotPasswordEmail('');
                    }}
                    className="w-full bg-black hover:bg-gray-600 text-white py-2 rounded mt-4"
                >
                  Back
                </button>
                <button
                    type="button"
                    onClick={async (e) => {
                      if (validateEmail(forgotPasswordEmail)) {
                        await handleForgotPassword(e)
                      } else {
                        console.log("failed");
                        setFormErrors((prevErrors) => ({
                          ...prevErrors,
                          forgotPasswordEmail: 'Invalid email address.',
                        }));
                      }
                    }}
                    //handleSignUp
                    disabled={(!forgotPasswordEmail) || formErrors.forgotPasswordEmail}
                    className={`w-full py-2 rounded mt-4 ${(forgotPasswordEmail) && (!formErrors.forgotPasswordEmail) ? 'bg-black hover:bg-gray-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  Submit
                </button>
              </div>
          )}
        </div>
          {componentIndex === 0 && (
        <div className="flex items-center justify-center whitespace-nowrap mt-3 absolute left-1/2 -translate-x-1/2">
          <p>Don't have an account?</p>
          <button
              type="button"
              onClick={() => navigate("/register")}
              className=" hover:text-gray-500 text-black underline italic ml-2"
          >
            Create Account
          </button>
        </div>
              )}
        </div>
      </div>
  );
};

export default Login;