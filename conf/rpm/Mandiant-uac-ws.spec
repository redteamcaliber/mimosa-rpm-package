Name:       {{NAME}}
Version:    {{VERSION}}
Release:    {{RELEASE}}
Summary:    The Mandiant Unified Analyst Console (UAC)
Vendor:     MANDIANT Corporation
License:    Commercial
Group:      Applications/Internet
URL:        http://www.mandiant.com
Source:     %{name}-%{version}.tgz
AutoReqProv: no

%description
Mandiant Unified Analyst Console (UAC) web application.

%prep
INFO="Processing sources.."
cd %_builddir
rm -rf *
for src in %{sources}; do
    INFO="Processing source: ${src}"
    cd %_builddir
    rm -rf %{name}-%{version}
    mkdir -p %_builddir/%{name}-%{version}
    cd %_builddir/%{name}-%{version}
    /usr/bin/gzip -dc ${src} | /bin/tar -xf -
    if [ $? -gt 0 ]; then
        # Error
        echo "Error while unzipping source file: ${sourcedir}"
        exit 1
    fi
    #/bin/chmod -Rf a+rX,u+w,g-w,o-w .
done
INFO='Finished processing sources...'

%install
INFO='install phase...'
# Add the application files to the package.
rm -rf %{buildroot}/opt/web/apps/uac

mkdir -p %{buildroot}/opt/web/apps/uac
cp -r %_builddir/%{name}-%{version}/* %{buildroot}/opt/web/apps/uac

rm -rf %{buildroot}/etc

# Copy the UAC NGINX and SSL conf templates.
mkdir -p %{buildroot}/etc/nginx/conf.d
cp %_builddir/%{name}-%{version}/conf/nginx/%{name}.template %{buildroot}/etc/nginx/conf.d/.
cp %_builddir/%{name}-%{version}/conf/nginx/%{name}-ssl.template %{buildroot}/etc/nginx/conf.d/.

# Copy the UAC upstart conf file.
mkdir -p %{buildroot}/etc/init
cp %_builddir/%{name}-%{version}/conf/upstart/uac.conf %{buildroot}/etc/init/.

ls -l %{buildroot}

# Ensure there is a logs directory.
mkdir -p %{buildroot}/opt/web/apps/uac/logs

%files
%defattr(-,root,root,-)
/opt/web/apps/uac
/etc/nginx/conf.d/Mandiant-uac-ws.template
/etc/nginx/conf.d/Mandiant-uac-ws-ssl.template
/etc/init/uac.conf

%post

