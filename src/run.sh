#!/bin/sh

cd /project/target
javac /project/target/Player.java
java -cp .:codingame-viewer.jar Viewer

echo "CG> open -s /tmp /index.html"

