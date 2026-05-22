import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import Login from "../Login";
import Register from "../Register";
import LoginAccount from "../LoginAccountScreen";
import ForgotPassword from "../ForgotPasswordScreen";
import SetNewPassword from "../SetNewPassword";
import PasswordSuccess from "../PasswordUpdatedSuccess";
import CreateAccount from "../CreateAccountScreen";
import OTPScreen from "../OTPScreen";


const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="LoginAccount"
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="LoginAccount" component={LoginAccount} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
      <Stack.Screen name="PasswordSuccess" component={PasswordSuccess} />
      <Stack.Screen name="CreateAccount" component={CreateAccount} />
    </Stack.Navigator>
  );
};
export default AuthStack;