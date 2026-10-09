const ldap = require('ldapjs');

const client = ldap.createClient({
  url: 'ldap://icetel.ice:389'
});

client.bind(
  'ICETEL\\lumong4',
  'Teletrabajo2026@',
  (err) => {

    if (err) {
      console.log(err);
      return;
    }

    console.log('LOGIN OK');

    const opts = {
    filter: '(sAMAccountName=lumong4)',
    scope: 'sub',
    attributes: [
        'displayName',
        'mail',
        'department',
        'company',
        'physicalDeliveryOfficeName',
        'sAMAccountName',
        'userPrincipalName',
        'mobile',
        'memberOf'
    ]
    };

    client.search(
        'DC=icetel,DC=ice',
        opts,
        (err, res) => {

            if (err) {
                console.log(err);
                return;
            }

            res.on('searchEntry', (entry) => {

                const usuario = {};

                entry.pojo.attributes.forEach(attr => {
                    usuario[attr.type] = attr.values[0];
                });

                console.log('Nombre:', usuario.displayName);
                console.log('Correo:', usuario.mail);
                console.log('Departamento:', usuario.department);
                console.log('Empresa:', usuario.company);
                console.log('Usuario:', usuario.sAMAccountName);
                console.log('Móvil:', usuario.mobile);

            });
        }
    );
}
);