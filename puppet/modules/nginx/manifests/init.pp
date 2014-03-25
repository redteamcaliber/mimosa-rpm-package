class nginx {
  #create key folder
  file { "/etc/pki/uac":
    ensure => "directory",
  }

  #generate key
  openssl::certificate::x509 { 'uac_ws':
    ensure       => present,
    country      => 'US',
    organization => 'Mandiant',
    commonname   => $fqdn,
    state        => 'VA',
    locality     => 'Reston',
    unit         => 'MMD',
    altnames     => [$fqdn],
    base_dir     => '/etc/pki/uac',
    owner        => 'vagrant',
    password     => 'mandiant',
    cnf_tpl      => 'nginx/cert.cnf.erb',
    require      => File['/etc/pki/uac']
  }

  #remove passphrase
  exec { 'remove_ssl_passphrase':
    command => '/usr/bin/openssl rsa -in /etc/pki/uac/uac_ws.key -out /etc/pki/uac/uac_ws.key -passin pass:mandiant',
    require => openssl::certificate::x509['uac_ws']
  }

  #install nginx mirror
  package { "nginx-mirror":
       provider => rpm,
       ensure   => installed,
       source   => "http://mirror.webtatic.com/yum/el6/latest.rpm"
  }

  #install nginx
  package { "nginx14":
    ensure  => present,
    require => [Package['nginx-mirror'], Exec['remove_ssl_passphrase']]
  }

  #start the service
  service { 'nginx':
    ensure  => running,
    require => Package['nginx14']
  }

  #poke an http/https hole for nginx
  firewall { '100 allow http and https access':
    port   => [80, 443],
    proto  => tcp,
    action => accept,
  }

  nginx::conf { ['uac.conf']: }
}
