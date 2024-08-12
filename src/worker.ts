/**
 * Welcome to Cloudflare Workers! This is Hasura's allowlist template.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { parse } from "graphql";

// The configuration for the allowlist
let config = {
  headers: {
    "hasura-m-auth": "zZkhKqFjqXR4g5MZCsJUZCnhCcoPyZ",
  },
  allowlist: [
    "query IntrospectionQuery{__schema{queryType{name}mutationType{name}subscriptionType{name}types{...FullType}directives{name description locations args{...InputValue}}}}fragment FullType on __Type{kind name description fields(includeDeprecated:true){name description args{...InputValue}type{...TypeRef}isDeprecated deprecationReason}inputFields{...InputValue}interfaces{...TypeRef}enumValues(includeDeprecated:true){name description isDeprecated deprecationReason}possibleTypes{...TypeRef}}fragment InputValue on __InputValue{name description type{...TypeRef}defaultValue}fragment TypeRef on __Type{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name}}}}}}}}}}",
    "query MyQuery {\n  getAuthorById(author_id: 10) {\n    first_name\n    id\n    last_name\n  }\n}",
  ],
};

// Create a hashset of the allowlist queries for fast lookup
let allowlist = config.allowlist;
let hashSetAllowlist = new Set();
for (let i = 0; i < allowlist.length; i++) {
  hashSetAllowlist.add(
    JSON.stringify(parse(allowlist[i], { noLocation: true }).definitions)
  );
}

export default {
  async fetch(request, env, ctx) {
    let rawRequest = await request.json();
    // Check if the header is present and matches the configuration
    if (
      request.headers === null ||
      request.headers.get("hasura-m-auth") !== config.headers["hasura-m-auth"]
    ) {
      console.log("Header not found, sending 400");
      let response = new Blob([
        JSON.stringify({ message: "unauthorized request" }),
      ]);
      return new Response(response, { status: 400 });
    }
    // Parse the query
    const query = rawRequest["rawRequest"]["query"];
    const parsedQuery = parse(query, { noLocation: true }).definitions;
    const stringifiedParsedQuery = JSON.stringify(parsedQuery);
    // Check if the query is in the allowlist
    if (hashSetAllowlist.has(stringifiedParsedQuery)) {
      return new Response(null, { status: 204 });
    } else {
      let response = new Blob([
        JSON.stringify({ message: "Query not allowed" }),
      ]);
      return new Response(response, { status: 400 });
    }
  },
};
