class postgres {
  package { "postgres-mirror":
       provider => rpm,
       ensure => installed,
       source => "http://yum.postgresql.org/9.3/redhat/rhel-6-x86_64/pgdg-centos93-9.3-1.noarch.rpm"
  }
  file {'uac-database-schema':
    ensure => present,
    path   => '/tmp/uac-database-schema.sql',
    owner  => 'root',
    group  => 'root',
    mode   => '0644',
    source => 'puppet:///modules/postgres/create_tables.sql',
  }
  file {'uac-database-data':
    ensure => present,
    path   => '/tmp/uac-database-data.sql',
    owner  => 'root',
    group  => 'root',
    mode   => '0644',
    source => 'puppet:///modules/postgres/create_data.sql',
  }
  class { 'postgresql::globals':
    server_package_name       => 'postgresql93-server',
    datadir                   => '/var/lib/pgsql/9.3/data',
    service_name              => 'postgresql-9.3',
    bindir                    => '/usr/pgsql-9.3/bin',
  }->
  class { 'postgresql::server':
    ip_mask_deny_postgres_user => '0.0.0.0/32',
    ip_mask_allow_all_users    => '0.0.0.0/0',
    listen_addresses           => '*',
    postgres_password          => 'devnet',
    require                    => Package['postgres-mirror']
  }->
  postgresql::server::db { 'uac':
    user     => 'uac_user',
    password => postgresql_password('uac_user', 'devnet'),
  }->
  postgresql::validate_db_connection { 'validate my postgres connection':
    database_host           => '127.0.0.1',
    database_username       => 'uac_user',
    database_password       => 'devnet',
    database_name           => 'uac',
  }->
  exec { 'install uac schema':
    environment => ["PGPASSWORD=devnet"],
    command => '/usr/pgsql-9.3/bin/psql -h 127.0.0.1 -U uac_user -d uac < /tmp/uac-database-schema.sql',
  }->
  exec { 'install uac data':
    environment => ["PGPASSWORD=devnet"],
    command => '/usr/pgsql-9.3/bin/psql -h 127.0.0.1 -U uac_user -d uac < /tmp/uac-database-data.sql',
  }
}

