using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EstruturasRepeticao01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            int total = 2;
            for(int i = 0; i < 5; i += 1)
            {
                total = total * 2;
            }
            MessageBox.Show("O total é: " + total);
        }

        private void button2_Click(object sender, EventArgs e)
        {
            int total = 0;
            int totalSoma = 0;
            for (int i = 0; i <= 1000; i += 1)
            {
                total = total + 1;
                totalSoma = total + totalSoma;
            }
            MessageBox.Show("Soma de 1 até 1000: " + totalSoma);
        }

        private void button3_Click(object sender, EventArgs e)
        {
            //int numero = 0;
            //for (int i = 0; i <= 100; i += 1)
            //{
            //    numero = numero + 1;
            //}
            //if (numero % 3 == 0)
            //{
            //    MessageBox.Show("O número " + numero + " é múltiplo de 3.");
            //}
            //else
            //{

            //}

            //        MessageBox.Show("O número " + numero + " não é múltiplo de 3.");
        }
    }
}
