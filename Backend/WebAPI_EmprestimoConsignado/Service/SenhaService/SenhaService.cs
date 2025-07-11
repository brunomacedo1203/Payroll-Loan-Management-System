﻿using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using WebAPI_EmprestimoConsignado.Models; 

namespace WebAPI_EmprestimoConsignado.Service.SenhaService
{
    public class SenhaService : ISenhaInterface
    {
        private readonly IConfiguration _config;

        public SenhaService(IConfiguration config)
        {
            _config = config;
        }
       
        public void CriarSenhaHash(string senha, out byte[] senhaHash, out byte[] senhaSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                senhaSalt = hmac.Key;
                senhaHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(senha));
            }
        }
       
        public bool VerificaSenhaHash(string senha, byte[] senhaHash, byte[] senhaSalt)
        {
            using (var hmac = new HMACSHA512(senhaSalt))
            {
                var computedHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(senha));
                return computedHash.SequenceEqual(senhaHash);
            }
        }
       
        public string CriarToken(UsuarioModel usuario)
        {
            Console.WriteLine("[CriarToken] Email do usuário: " + usuario.Email);
            Console.WriteLine("[CriarToken] Chave secreta: " + _config.GetSection("AppSettings:Token").Value);
            List<Claim> claims = new List<Claim>()
            {
                new Claim("Cargo", usuario.Cargo.ToString()),
                new Claim("Email", usuario.Email),
                new Claim("Username", usuario.Usuario)
            };
            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_config.GetSection("AppSettings:Token").Value));
            var cred = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);
            var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.Now.AddDays(1),
                    signingCredentials: cred
                );
            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            Console.WriteLine("[CriarToken] JWT gerado: " + jwt);
            return jwt;
        }
    }
}
