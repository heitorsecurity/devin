using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EstruturaControle02
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Qual vai ser a mensagem exibida pelo código seguinte?
            // "Você está no negativo!"
            // "Você é um bom cliente"
            // Nenhuma mensagem
            // "Você é milionário!"
            // "Você é um bom cliente", seguida de "Você é milionário!"
            double saldo = 500.0;
            if (saldo < 0.0)
            {
                MessageBox.Show("Você está no negativo!");
            }
            else if (saldo < 1000000.0)
            {
                MessageBox.Show("Você é um bom cliente");
            } else
            {
                MessageBox.Show("Você é milionário!");
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            // Uma pessoa só pode votar em eleições brasileiras se ela for
            // maior que 16 anos e for cidadã brasileira. Crie um programa
            // com duas variáveis, int idade, bool brasileira, e faça
            // com que o programa diga se a pessoa está apta a votar ou
            // não, de acordo com os dados nas variáveis.
            int idade = 15;
            bool brasileira = false;
            if (idade >= 16 && brasileira == true)
            {
                MessageBox.Show("Está apto(a) a votar");
            }
            else if (idade < 16 && brasileira == false)
            {
                MessageBox.Show("Você é estrangeiro(a), mas não esta apto(a) a votar");
            }
            else if (idade >= 16 && brasileira == false)
            {
                MessageBox.Show("Você é estrangeiro(a), mas está apto(a) a votar");
            }
            else
            {
                MessageBox.Show("Não esta apto(a) a votar, só apartir dos 16 anos.");
            }
                
            //double taxa = 0;
            //if (saldo < 1000)
            //{
            //    taxa = 0.01;
            //}
            //else if(saldo <= 5000)
            //{
            //    taxa = 0.05;
            //}
            //else
            //{
            //    taxa = 0.1;
            //}
        }

        private void button3_Click(object sender, EventArgs e)
        {
            // Crie um programa que tenha uma variável double valorDaNotaFiscal
            // e, de acordo com esse valor, o imposto deve ser calculado. As
            // regras de cálculo são:
            // Se o valor for menor que 999, o imposto deve ser de 2 %
            // Se o valor estiver entre 1000 e 2999, o imposto deve ser de 2.5 %
            // Se o valor estiver entre 3000 e 6999, o imposto deve ser de 2.8 %
            // Se for maior ou igual a 7000, o imposto deve ser de 3 %
            // Imprima o imposto em um MessageBox.
            double valorDaNotaFiscal = 50000.0;
            if(valorDaNotaFiscal < 999.9)
            {
                MessageBox.Show("Imposto de 2%");
            }
            else if(valorDaNotaFiscal >= 1000.0 && valorDaNotaFiscal <= 2999.9)
            {
                MessageBox.Show("Imposto de 2.5%");
            }
            else if(valorDaNotaFiscal >= 3000.0 && valorDaNotaFiscal <= 6999.9)
            {
                MessageBox.Show("Imposto de 2.8%");
            }
            else
            {
                MessageBox.Show("Imposto de 3%");
            }
        }
    }
}
