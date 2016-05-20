using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EstruturaControle01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Qual é a mensagem e o valor da variável saldo após a execução
            // do seguinte código?
            // mensagem: Saque realizado com sucesso; saldo: 90.0
            // mensagem: Saldo Insuficiente; saldo 90.0
            // mensagem: Saque realizado com sucesso; saldo: 100.0
            // mensagem: Saldo Insuficiente; saldo 100.0
            // mensagem: Saque realizado com sucesso; saldo: 10.0
            double saldo = 100.0;
            double valorSaque = 10.0;
            
            if(saldo >= valorSaque)
            {
                saldo -= valorSaque;
                MessageBox.Show("Saque realizado com sucesso");
            }
            else
            {
                MessageBox.Show("Saldo Insuficiente");
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            // Qual é a mensagem e o valor da variável saldo após a execução
            // do seguinte código?
            // mensagem: Saque realizado com sucesso; saldo: -5.0
            // mensagem: Saldo Insuficiente; saldo - 5.0
            // mensagem: Saque realizado com sucesso; saldo: 5.0
            // mensagem: Saldo Insuficiente; saldo 5.0
            // mensagem: Saque realizado com sucesso; saldo: 10.0
            double saldo = 5.0;
            double valorSaque = 10.0;

            if(saldo >= valorSaque)
            {
                saldo -= valorSaque;
                MessageBox.Show("Saque realizado com sucesso");
            }
            else
            {
                MessageBox.Show("Saldo Insuficiente");
            }
        }
    }
}
