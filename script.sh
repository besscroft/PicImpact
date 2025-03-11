#!/bin/sh

npx prisma@6.4.1 migrate deploy

HOSTNAME="0.0.0.0" node server.js
