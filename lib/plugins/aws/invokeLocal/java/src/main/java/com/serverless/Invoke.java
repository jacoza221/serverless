package com.serverless;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.HashMap;

public class Invoke {
  private File artifact;
  private String className;
  private Object instance;
  private Class clazz;

  private Invoke() {
    this.artifact = new File(new File("."), System.getProperty("artifactPath"));
    this.className = System.getProperty("className");

    try {
      HashMap<String, Object> parsedInput = parseInput(getInput());

      this.instance = this.getInstance();
      System.out.println(this.invoke(parsedInput, new Context()));
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private Object getInstance() throws Exception {
    URL[] urls = {this.artifact.toURI().toURL()};
    URLClassLoader child = new URLClassLoader(urls, this.getClass().getClassLoader());

    this.clazz = Class.forName(this.className, true, child);

    return this.clazz.newInstance();
  }

  private Object invoke(HashMap<String, Object> event, Context context) throws Exception {
    Method[] methods = this.clazz.getDeclaredMethods();

    return methods[1].invoke(this.instance, event, context);
  }

  private HashMap<String, Object> parseInput(String input) throws IOException {
    TypeReference<HashMap<String,Object>> typeRef = new TypeReference<HashMap<String,Object>>() {};
    ObjectMapper mapper = new ObjectMapper();

    JsonNode jsonNode = mapper.readTree(input);

    return mapper.convertValue(jsonNode, typeRef);
  }

  private String getInput() throws IOException {
    BufferedReader streamReader = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
    StringBuilder inputStringBuilder = new StringBuilder();
    String inputStr;

    while ((inputStr = streamReader.readLine()) != null) {
      inputStringBuilder.append(inputStr);
    }

    return inputStringBuilder.toString();
  }

  public static void main(String[] args) {
    new Invoke();
  }
}
