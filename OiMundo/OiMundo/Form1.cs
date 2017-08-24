using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace OiMundo
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Hello World");
        }

        private void button5_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Nenhuma das opções");
        }

        private void button4_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Caelum");
        }

        private void button2_Click(object sender, EventArgs e)
        {
            // Qual a mensagem que será exibida na caixa de texto
            // criada pelo seguinte código?
            // MessageBox.Show("Curso de C# da Caelum");
            // Hello World
            // Curso de C# da Caelum
            // Olá Mundo
            // Caelum
            // Nenhuma das opções
            MessageBox.Show("Curso de C# da Caelum");
        }

        private void button3_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Olá Mundo");
        }
    }
}
