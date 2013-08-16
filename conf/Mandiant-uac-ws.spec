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
Requires:

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
rm -rf %{buildroot}/opt/venvs/uac

mkdir -p %{buildroot}/opt/venvs/uac
cp -r %_builddir/%{name}-%{version}/* %{buildroot}/opt/venvs/uac

# Add the Apache conf template file to the package.  This file must be edited and renamed to .conf by an admin.
rm -rf %{buildroot}/etc
mkdir -p %{buildroot}/etc/httpd/conf.d
cp %_builddir/%{name}-%{version}/site/conf/%{name}.template %{buildroot}/etc/httpd/conf.d/uac.template

ls -l %{buildroot}

%files
%defattr(-,root,root,-)
/opt/venvs/uac
/etc/httpd/conf.d/uac.template

%post
/opt/venvs/uac/bin/python /opt/venvs/uac/site/manage.py collectstatic -v0 --noinput
/opt/venvs/uac/bin/python /opt/venvs/uac/site/manage.py compress


