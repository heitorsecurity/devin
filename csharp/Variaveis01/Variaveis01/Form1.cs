using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Variaveis01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            int idadeJoao = 10;
            int idadeMaria = 25;
            int mediaIdades = (idadeJoao + idadeMaria) / 2;

            MessageBox.Show(mediaIdades.ToString());
        }

        private void button2_Click(object sender, EventArgs e)
        {
            //int pi = 3.14;
            //MessageBox.Show(pi.ToString());

            double pi = 3.14;
            int piQuebrado = (int)pi;
            MessageBox.Show("piQuebrado = " + piQuebrado);
        }

        private void button3_Click(object sender, EventArgs e)
        {
            int a = 3;
            int b = 8;
            int c = 2;
            double delta = (b * b) - (4 * a * c);
            double a1 = (-b + Math.Sqrt(delta)) / (2 * a);
            double a2 = (-b - Math.Sqrt(delta)) / (2 * a);

            MessageBox.Show("a1 = " + a1 + " e a2 = " + a2);
        }
    }
}
