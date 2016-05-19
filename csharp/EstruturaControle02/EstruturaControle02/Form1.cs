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
