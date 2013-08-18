#!/bin/bash

# Version settings.
NAME="Mandiant-uac-ws"
VERSION="0.2"
RELEASE="1"

# The git branch to build.
BRANCH=master
# The repo to build.
REPO=git@github.mandiant.com:amilano/uac-node.git

# The build directory.
BUILD_DIR=/root/build

# The source project directory.
PROJECT_DIR=$BUILD_DIR/uac

# The RPM build output directory.
RPMBUILD_DIR=$BUILD_DIR/rpmbuild

# The format of the rpm file.
RPM_FILE=$NAME-$VERSION.tgz

# The tar file.
TAR_FILE=$RPMBUILD_DIR/SOURCES/$RPM_FILE


echo
echo "Building $NAME..."
echo "Version: $VERSION"
echo "Release: $RELEASE"
echo "Build Directory: $BUILD_DIR"
echo "Project Directory: $PROJECT_DIR"

if [ -z "$BRANCH" ]; then
    echo "BRANCH is not set."
    exit 1
fi

if [ -z "$BUILD_DIR" ]; then
    echo "BUILD_DIR is not set."
    exit 1
fi

if [ -z "$PROJECT_DIR" ]; then
    echo "PROJECT_DIR is not set."
    exit 1
fi

# Remove any existing aritfacts.
read -p "Delete build directory: $BUILD_DIR? (y/n): " -n 1
if [ "x$REPLY" = "xy" ]; then
    rm -rf $BUILD_DIR
else
    exit 1
fi

# Create the build output directory.
mkdir -p $BUILD_DIR

# Pull the code into the build directory.
echo
git clone -b $BRANCH $REPO $PROJECT_DIR

echo 'Creating the build area...'
mkdir $RPMBUILD_DIR
mkdir $RPMBUILD_DIR/BUILD
mkdir $RPMBUILD_DIR/RPMS
mkdir $RPMBUILD_DIR/SOURCES
mkdir $RPMBUILD_DIR/SPECS
mkdir $RPMBUILD_DIR/SRPMS
mkdir $RPMBUILD_DIR/tmp
echo 'OK'


# Create the rpm spec file.
echo 'Generating the spec file...'
sed -e s,{{NAME}},$NAME,g \
    -e s,{{VERSION}},$VERSION,g \
    -e s,{{RELEASE}},$RELEASE,g \
    ${PROJECT_DIR}/conf/rpm/${NAME}.spec > ${RPMBUILD_DIR}/SPECS/${NAME}.spec
if [ $? -gt 0 ]; then
    # Error
    echo 'Error creating spec file.'
    exit 1
fi
echo 'OK'

# Import the node dependencies.
cd $PROJECT_DIR
chmod +x ./bin/*
./bin/install_libs.sh

# Create the rpm tar.
echo "Creating the source tar file: $TAR_FILE from source: $PROJECT_DIR/*"
tar -czf ${TAR_FILE} --exclude=conf/env.json --exclude=sql --exclude=docs *
if [ $? -gt 0 ]; then
    # Error
    echo 'Error creating tar file.'
    exit 1
fi
echo 'OK'

# Create the rpm.
echo 'Building the RPM...'
cd $BUILD_DIR
rpmbuild --define "_topdir $RPMBUILD_DIR" -bb rpmbuild/SPECS/$NAME.spec
if [ $? -gt 0 ]; then
    # Error
    echo 'Error creating the RPM package.'
    exit 0
fi
echo 'OK'
