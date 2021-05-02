#!/usr/bin/env bash

rm -rf out
electron-packager . isotope --out out --overwrite --ignore=^/src --ignore=^/dist/server
