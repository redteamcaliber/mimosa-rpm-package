define nginx::conf() {
  file { "/etc/nginx/conf.d/${name}":
    source  => "puppet:///modules/nginx/${name}",
    require => Package['nginx14'],
    notify  => Service['nginx'];
  }
}