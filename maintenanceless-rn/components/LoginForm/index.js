import React from "react";
import { View, TextInput, StyleSheet, Button } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Formik } from "formik";
import axios from "axios";

import { API_URL } from "@env";

const LoginForm = () => {
  return (
    <Formik
      initialValues={{
        email: "test",
        password: ""
      }}
      onSubmit={async values => {
        console.log(API_URL+'/auth/login');
        try {
          const result = await axios.post(API_URL + "/auth/login", {
            email: values.email,
            password: values.password
          });
          console.log(result.data);
        } catch(err) {
          console.log(err.response.data)
        }
      }}
    >
      {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View style={styles.container}>
          <TextInput
            style={styles.inputField}
            onChangeText={handleChange("email")}
            value={values.email}
          />
          <TextInput
            style={styles.inputField}
            onChangeText={handleChange("password")}
            value={values.password}
          />
          <Button onPress={handleSubmit} title="Log In" />
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '80%',
    marginTop: 10
  },
  inputField: {
    borderColor: 'black',
    borderWidth: 1,
    borderStyle: 'solid',
    height: 30,
    fontSize: 20,
    marginTop: 15
  }
});

export default LoginForm;
